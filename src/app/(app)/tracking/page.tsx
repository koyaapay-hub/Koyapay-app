"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { fmtFcfa } from "@/lib/fees";
import { downloadBulletin } from "@/lib/bulletin";

type Payroll = {
  id: string;
  payment_date: string;
  status: string;
  employee_count: number;
  total_net: number;
  fees: number;
  total_deposit: number;
  deposit_method: string | null;
  salary_month: string | null;
  created_at: string;
};

type Item = {
  id: string;
  first_name: string;
  last_name: string;
  mobile_money: string;
  base_salary: number;
  commission: number;
  primes: number;
  transport: number;
  autres: number;
  retenues: number;
  other1_label: string | null;
  other1_amount: number;
  other2_label: string | null;
  other2_amount: number;
  net: number;
  status: string;
  fail_reason: string | null;
  retries: number;
  bulletin_sent: boolean;
};

const MAX_RETRIES = 3;

const statusLabel: Record<string, string> = {
  draft: "Brouillon",
  scheduled: "Programmée",
  processing: "En cours",
  completed: "Terminée",
  partial: "Partielle",
  cancelled: "Annulée",
  pending: "En attente",
  paid: "Payé",
  failed: "Échec",
};

export default function TrackingPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [selected, setSelected] = useState<Payroll | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [company, setCompany] = useState<{
    name: string;
    director_name: string | null;
    phone: string | null;
    company_email: string | null;
    company_address: string | null;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
  }>({
    name: "Entreprise",
    director_name: null,
    phone: null,
    company_email: null,
    company_address: null,
    logo_url: null,
    stamp_url: null,
    signature_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const loadPayrolls = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: co } = await supabase
      .from("companies")
      .select("name, director_name, phone, company_email, company_address, logo_url, stamp_url, signature_url")
      .eq("id", user.id)
      .single();
    if (co) {
      setCompany({
        name: co.name || "Entreprise",
        director_name: co.director_name,
        phone: co.phone,
        company_email: co.company_email,
        company_address: co.company_address,
        logo_url: co.logo_url,
        stamp_url: co.stamp_url,
        signature_url: co.signature_url,
      });
    }

    const { data } = await supabase
      .from("payrolls")
      .select("*")
      .eq("company_id", user.id)
      .order("created_at", { ascending: false });
    setPayrolls((data as Payroll[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPayrolls();
  }, [loadPayrolls]);

  async function openPayroll(p: Payroll) {
    setSelected(p);
    setBusy("load");
    const supabase = createClient();
    const { data } = await supabase
      .from("payroll_items")
      .select("*")
      .eq("payroll_id", p.id)
      .order("last_name");
    setItems((data as Item[]) || []);
    setBusy(null);
  }

  async function retryItem(item: Item) {
    if (item.retries >= MAX_RETRIES) return;
    setBusy(item.id);
    const supabase = createClient();
    const nextRetries = item.retries + 1;
    const success = nextRetries >= MAX_RETRIES;
    const { error } = await supabase
      .from("payroll_items")
      .update({
        retries: nextRetries,
        status: success ? "paid" : "failed",
        fail_reason: success ? null : item.fail_reason || "Échec opérateur",
        bulletin_sent: success,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (!error && selected) {
      const { data } = await supabase
        .from("payroll_items")
        .select("*")
        .eq("payroll_id", selected.id)
        .order("last_name");
      const list = (data as Item[]) || [];
      setItems(list);

      const paid = list.filter((x) => x.status === "paid").length;
      const failed = list.filter((x) => x.status === "failed").length;
      let st = selected.status;
      if (failed === 0) st = "completed";
      else if (paid > 0) st = "partial";
      else st = "processing";

      await supabase.from("payrolls").update({ status: st, updated_at: new Date().toISOString() }).eq("id", selected.id);
      setSelected({ ...selected, status: st });
      loadPayrolls();
    }
    setBusy(null);
  }

  function handleBulletin(item: Item) {
    if (!selected) return;
    downloadBulletin({
      companyName: company.name,
      companyAddress: company.company_address,
      companyPhone: company.phone,
      companyEmail: company.company_email,
      directorName: company.director_name || company.name,
      logoDataUrl: company.logo_url,
      stampDataUrl: company.stamp_url,
      signatureDataUrl: company.signature_url,
      employeeName: `${item.first_name} ${item.last_name}`,
      mobileMoney: item.mobile_money,
      cnss: false,
      salaryMonth: selected.salary_month || selected.payment_date?.slice(0, 7) || "",
      paymentDate: selected.payment_date,
      base_salary: Number(item.base_salary) || 0,
      commission: Number(item.commission) || 0,
      primes: Number(item.primes) || 0,
      transport: Number(item.transport) || 0,
      retenues: Number(item.retenues) || 0,
      other1_label: item.other1_label,
      other1_amount: Number(item.other1_amount) || 0,
      other2_label: item.other2_label,
      other2_amount: Number(item.other2_amount) || 0,
      net: Number(item.net) || 0,
    });
  }

  const counts = {
    paid: items.filter((i) => i.status === "paid").length,
    pending: items.filter((i) => i.status === "pending").length,
    failed: items.filter((i) => i.status === "failed").length,
  };

  if (loading) {
    return <div className="px-5 py-16 text-center text-ink-soft text-sm">Chargement…</div>;
  }

  if (selected) {
    return (
      <>
        <header className="bg-gradient-to-br from-navy to-navy-2 text-paper px-5 pt-8 pb-5">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-[12.5px] text-white/70 font-semibold mb-2 bg-transparent border-0 p-0"
          >
            ← Retour
          </button>
          <h1 className="font-display text-[19px] font-semibold">
            Paie du{" "}
            {new Date(selected.payment_date + "T12:00:00").toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
            })}
          </h1>
          <p className="text-[12.5px] text-white/65 mt-1">
            {statusLabel[selected.status] || selected.status} · {fmtFcfa(Number(selected.total_net))}
          </p>
          <div className="flex gap-2 mt-4">
            {[
              ["Payés", counts.paid, "ok"],
              ["Attente", counts.pending, "wait"],
              ["Échecs", counts.failed, "fail"],
            ].map(([label, n, k]) => (
              <div key={k as string} className="flex-1 bg-white/10 rounded-xl px-2 py-2 text-center">
                <p className="font-display text-sm font-semibold">{n as number}</p>
                <p className="text-[9.5px] text-white/55">{label as string}</p>
              </div>
            ))}
          </div>
        </header>

        <main className="px-4 py-4 space-y-2.5">
          {busy === "load" && <p className="text-center text-sm text-ink-soft">Chargement…</p>}
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-[var(--line)] rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-green-bg text-green-deep flex items-center justify-center font-display font-semibold text-xs flex-shrink-0">
                {(item.first_name[0] || "") + (item.last_name[0] || "")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13.5px]">
                  {item.first_name} {item.last_name}
                </p>
                <p className="text-[11.5px] text-ink-soft">{fmtFcfa(Number(item.net))}</p>
                {item.status === "failed" && item.fail_reason && (
                  <p className="text-[10.5px] text-danger mt-1 leading-snug">{item.fail_reason}</p>
                )}
                {item.status === "failed" && item.retries >= MAX_RETRIES && (
                  <p className="text-[10.5px] text-danger mt-1">
                    Max relances atteint. Fonds remis au solde après 7 j sans action.
                  </p>
                )}
                {item.status === "failed" && item.retries < MAX_RETRIES && (
                  <button
                    type="button"
                    disabled={busy === item.id}
                    onClick={() => retryItem(item)}
                    className="mt-2 text-[10.5px] font-bold text-danger border border-danger rounded-lg px-2.5 py-1 bg-transparent"
                  >
                    {busy === item.id ? "…" : `Relancer (${item.retries}/${MAX_RETRIES})`}
                  </button>
                )}
              </div>
              <span
                className={`text-[10.5px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                  item.status === "paid"
                    ? "bg-green-bg text-green-deep"
                    : item.status === "failed"
                    ? "bg-red-50 text-danger"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {statusLabel[item.status] || item.status}
              </span>
            </div>
          ))}

          <div className="mt-4">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-soft mb-2">Bulletins PDF</p>
            {items.filter((i) => i.status === "paid").length === 0 && (
              <p className="text-[12.5px] text-ink-soft">Aucun employé payé pour générer un bulletin.</p>
            )}
            {items
              .filter((i) => i.status === "paid")
              .map((i) => (
                <div
                  key={`b-${i.id}`}
                  className="flex items-center gap-2 py-2.5 border-t border-[var(--line)] text-[12.5px]"
                >
                  <span className="text-green-deep">📄</span>
                  <span className="flex-1 font-semibold">
                    {i.first_name} {i.last_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBulletin(i)}
                    className="text-[11px] font-bold text-[#1E7A64] bg-green-bg border-0 rounded-lg px-2.5 py-1.5"
                  >
                    Télécharger
                  </button>
                </div>
              ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="bg-gradient-to-br from-navy to-navy-2 text-paper px-5 pt-8 pb-6">
        <p className="text-green text-[11.5px] font-bold uppercase tracking-wider mb-1">Historique</p>
        <h1 className="font-display text-[19px] font-semibold">Suivi des paies</h1>
        <p className="text-[12.5px] text-white/65 mt-1.5">
          {payrolls.length} paie{payrolls.length !== 1 ? "s" : ""} enregistrée{payrolls.length !== 1 ? "s" : ""}
        </p>
      </header>

      <main className="px-4 py-4 space-y-2.5">
        {payrolls.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-ink-soft">Aucune paie pour le moment.</p>
            <Link
              href="/payroll"
              className="inline-block mt-4 bg-green text-navy font-bold text-sm rounded-[11px] px-5 py-3 no-underline"
            >
              Préparer une paie
            </Link>
          </div>
        )}

        {payrolls.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => openPayroll(p)}
            className="w-full text-left bg-white border border-[var(--line)] rounded-2xl p-3.5 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-[10px] bg-paper-2 text-green flex items-center justify-center text-lg">
              ₵
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13px]">
                {new Date(p.payment_date + "T12:00:00").toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-[11px] text-ink-soft">
                {p.employee_count} employé{p.employee_count > 1 ? "s" : ""} · {statusLabel[p.status] || p.status}
              </p>
            </div>
            <p className="font-display text-[13px] font-semibold">{fmtFcfa(Number(p.total_net))}</p>
          </button>
        ))}
      </main>
    </>
  );
}
