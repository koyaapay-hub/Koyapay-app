"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  deposit_phone: string | null;
  deposit_reference: string | null;
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

type Tx = {
  id: string;
  payment_date: string;
  salary_month: string | null;
  phone_used: string | null;
  amount: number;
  reference: string | null;
  status: string;
  created_at: string;
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

function moisLabel(ym: string | null | undefined): string {
  if (!ym || ym.length < 7) return "—";
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  const s = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function TrackingPage() {
  const [tab, setTab] = useState<"paies" | "transactions">("paies");
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
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
  const [filterMonth, setFilterMonth] = useState(""); // YYYY-MM
  const [filterYear, setFilterYear] = useState(""); // YYYY

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: co } = await supabase
      .from("companies")
      .select(
        "name, director_name, phone, company_email, company_address, logo_url, stamp_url, signature_url"
      )
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

    const { data: p } = await supabase
      .from("payrolls")
      .select("*")
      .eq("company_id", user.id)
      .order("created_at", { ascending: false });
    setPayrolls((p as Payroll[]) || []);

    const { data: t } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("company_id", user.id)
      .order("created_at", { ascending: false });

    // Fallback : construire des lignes depuis les paies si table vide
    if (t && t.length > 0) {
      setTxs(t as Tx[]);
    } else {
      setTxs(
        ((p as Payroll[]) || []).map((row) => ({
          id: row.id,
          payment_date: row.payment_date || row.created_at?.slice(0, 10),
          salary_month: row.salary_month,
          phone_used: row.deposit_phone || row.deposit_method,
          amount: Number(row.total_deposit) || 0,
          reference: row.deposit_reference || row.id.slice(0, 8).toUpperCase(),
          status: row.status,
          created_at: row.created_at,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const ym = p.salary_month || p.payment_date?.slice(0, 7) || "";
      if (filterMonth && ym !== filterMonth) return false;
      if (filterYear && !ym.startsWith(filterYear)) return false;
      return true;
    });
  }, [payrolls, filterMonth, filterYear]);

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
      await supabase
        .from("payrolls")
        .update({ status: st, updated_at: new Date().toISOString() })
        .eq("id", selected.id);
      setSelected({ ...selected, status: st });
      load();
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

  // Détail d'une paie
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
            Paie — {moisLabel(selected.salary_month || selected.payment_date?.slice(0, 7))}
          </h1>
          <p className="text-[12.5px] text-white/65 mt-1">
            {statusLabel[selected.status] || selected.status} · {fmtFcfa(Number(selected.total_net))}
          </p>
          <div className="flex gap-2 mt-4">
            {[
              ["Payés", counts.paid],
              ["Attente", counts.pending],
              ["Échecs", counts.failed],
            ].map(([label, n]) => (
              <div key={label as string} className="flex-1 bg-white/10 rounded-xl px-2 py-2 text-center">
                <p className="font-display text-sm font-semibold">{n as number}</p>
                <p className="text-[9.5px] text-white/55">{label as string}</p>
              </div>
            ))}
          </div>
        </header>
        <main className="px-4 py-4 space-y-2.5">
          {busy === "load" && <p className="text-center text-sm text-ink-soft">Chargement…</p>}
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[var(--line)] rounded-2xl p-3.5 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-[10px] bg-green-bg text-green-deep flex items-center justify-center font-display font-semibold text-xs flex-shrink-0">
                {(item.first_name[0] || "") + (item.last_name[0] || "")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13.5px]">
                  {item.first_name} {item.last_name}
                </p>
                <p className="text-[11.5px] text-ink-soft">{fmtFcfa(Number(item.net))}</p>
                {item.status === "failed" && item.fail_reason && (
                  <p className="text-[10.5px] text-danger mt-1">{item.fail_reason}</p>
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
                className={`text-[10.5px] font-bold px-2 py-1 rounded-full ${
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
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-soft mb-2">
              Bulletins PDF
            </p>
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
      <header className="bg-gradient-to-br from-navy to-navy-2 text-paper px-5 pt-8 pb-5">
        <p className="text-green text-[11.5px] font-bold uppercase tracking-wider mb-1">Finance</p>
        <h1 className="font-display text-[19px] font-semibold">Suivi</h1>

        {/* Onglets */}
        <div className="mt-4 flex bg-white/10 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setTab("paies")}
            className={`flex-1 py-2.5 rounded-[10px] text-[12.5px] font-bold border-0 ${
              tab === "paies" ? "bg-green text-navy" : "bg-transparent text-white/75"
            }`}
          >
            Suivi des paies
          </button>
          <button
            type="button"
            onClick={() => setTab("transactions")}
            className={`flex-1 py-2.5 rounded-[10px] text-[12.5px] font-bold border-0 ${
              tab === "transactions" ? "bg-green text-navy" : "bg-transparent text-white/75"
            }`}
          >
            Suivi des transactions
          </button>
        </div>
      </header>

      <main className="px-4 py-4">
        {tab === "paies" && (
          <>
            {/* Filtres mois / année */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-ink-soft mb-1">Mois</label>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => {
                    setFilterMonth(e.target.value);
                    if (e.target.value) setFilterYear(e.target.value.slice(0, 4));
                  }}
                  className="w-full border border-[var(--line)] rounded-lg px-2 py-2 text-sm outline-none focus:border-green"
                />
              </div>
              <div className="w-[110px]">
                <label className="block text-[10px] font-bold text-ink-soft mb-1">Année</label>
                <input
                  type="number"
                  min={2020}
                  max={2100}
                  placeholder="2026"
                  value={filterYear}
                  onChange={(e) => {
                    setFilterYear(e.target.value);
                    if (filterMonth && e.target.value && !filterMonth.startsWith(e.target.value)) {
                      setFilterMonth("");
                    }
                  }}
                  className="w-full border border-[var(--line)] rounded-lg px-2 py-2 text-sm outline-none focus:border-green"
                />
              </div>
              {(filterMonth || filterYear) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterMonth("");
                    setFilterYear("");
                  }}
                  className="self-end mb-0.5 text-[11px] font-bold text-ink-soft border border-[var(--line)] rounded-lg px-2 py-2 bg-white"
                >
                  Reset
                </button>
              )}
            </div>

            {filteredPayrolls.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-ink-soft">Aucune paie pour ce filtre.</p>
                <Link
                  href="/payroll"
                  className="inline-block mt-4 bg-green text-navy font-bold text-sm rounded-[11px] px-5 py-3 no-underline"
                >
                  Préparer une paie
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredPayrolls.map((p) => (
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
                        {moisLabel(p.salary_month || p.payment_date?.slice(0, 7))}
                      </p>
                      <p className="text-[11px] text-ink-soft">
                        {p.employee_count} employé{p.employee_count > 1 ? "s" : ""} ·{" "}
                        {statusLabel[p.status] || p.status}
                      </p>
                    </div>
                    <p className="font-display text-[13px] font-semibold">
                      {fmtFcfa(Number(p.total_net))}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "transactions" && (
          <>
            {txs.length === 0 ? (
              <div className="text-center py-12 text-sm text-ink-soft">
                Aucune transaction pour le moment.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden sm:grid grid-cols-5 gap-1 px-2 text-[10px] font-bold uppercase text-ink-soft tracking-wide">
                  <span>Jour</span>
                  <span>Salaire de</span>
                  <span>Numéro</span>
                  <span className="text-right">Montant</span>
                  <span className="text-right">Réf.</span>
                </div>
                {txs.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white border border-[var(--line)] rounded-2xl p-3.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-[11px] text-ink-soft">Jour</p>
                        <p className="font-semibold text-[13px]">
                          {tx.payment_date
                            ? new Date(tx.payment_date + "T12:00:00").toLocaleDateString("fr-FR")
                            : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-ink-soft">Montant</p>
                        <p className="font-display font-semibold text-[13px]">
                          {fmtFcfa(Number(tx.amount))}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[12.5px]">
                      <div>
                        <p className="text-[10px] text-ink-soft">Salaire de</p>
                        <p className="font-medium">{moisLabel(tx.salary_month)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-ink-soft">Numéro paiement</p>
                        <p className="font-medium">{tx.phone_used || "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-ink-soft">Référence</p>
                        <p className="font-mono text-[12px]">{tx.reference || "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
