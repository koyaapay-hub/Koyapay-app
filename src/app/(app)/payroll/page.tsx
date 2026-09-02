"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { computeFees, computeNet, fmtFcfa } from "@/lib/fees";

type Emp = {
  id: string;
  first_name: string;
  last_name: string;
  mobile_money: string;
  base_salary: number;
  cnss?: boolean;
};

type CustomOther = { label: string; amount: number };

type Row = Emp & {
  commission: number;
  primes: number;
  transport: number;
  retenues: number;
  others: CustomOther[];
  open?: boolean;
};

const METHODS = [
  { id: "MTN MoMo", label: "MTN MoMo" },
  { id: "Moov Money", label: "Moov Money" },
  { id: "Celtiis Cash", label: "Celtiis Cash" },
  { id: "Virement", label: "Virement" },
];

export default function PayrollPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDate, setPaymentDate] = useState("");
  const [salaryMonth, setSalaryMonth] = useState("");
  const [method, setMethod] = useState("MTN MoMo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name, mobile_money, base_salary, cnss")
      .eq("company_id", user.id)
      .order("last_name");

    setRows(
      (data || []).map((e) => ({
        ...e,
        base_salary: Number(e.base_salary) || 0,
        commission: 0,
        primes: 0,
        transport: 0,
        retenues: 0,
        others: [],
        open: false,
      }))
    );

    const d = new Date();
    d.setDate(d.getDate() + 5);
    setPaymentDate(d.toISOString().slice(0, 10));
    const now = new Date();
    setSalaryMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function rowNet(r: Row) {
    return computeNet({
      base_salary: r.base_salary,
      commission: r.commission,
      primes: r.primes,
      transport: r.transport,
      retenues: r.retenues,
      other1_amount: r.others[0]?.amount || 0,
      other2_amount: r.others[1]?.amount || 0,
    });
  }

  const totalNet = useMemo(() => rows.reduce((s, r) => s + rowNet(r), 0), [rows]);
  const fees = useMemo(() => computeFees(totalNet, rows.length), [totalNet, rows.length]);
  const totalDeposit = totalNet + fees;

  function updateVar(id: string, key: "commission" | "primes" | "transport" | "retenues", val: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: parseFloat(val) || 0 } : r))
    );
  }

  function toggleOpen(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, open: !r.open } : r)));
  }

  function addOther(id: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (r.others.length >= 2) return r;
        return { ...r, others: [...r.others, { label: "", amount: 0 }] };
      })
    );
  }

  function updateOther(id: string, index: number, field: "label" | "amount", val: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const others = r.others.map((o, i) => {
          if (i !== index) return o;
          if (field === "label") return { ...o, label: val };
          return { ...o, amount: parseFloat(val) || 0 };
        });
        return { ...r, others };
      })
    );
  }

  function removeOther(id: string, index: number) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return { ...r, others: r.others.filter((_, i) => i !== index) };
      })
    );
  }

  async function confirmPayroll() {
    setError("");
    if (!salaryMonth) {
      setError("Indiquez le mois de salaire.");
      return;
    }
    if (!paymentDate) {
      setError("Choisissez une date de paiement.");
      return;
    }
    if (rows.length === 0) {
      setError("Ajoutez au moins un employé.");
      return;
    }

    // Valider les "autres" : si montant > 0, label obligatoire
    for (const r of rows) {
      for (const o of r.others) {
        if (o.amount > 0 && !o.label.trim()) {
          setError(`Indiquez le nom de l’élément « Autre » pour ${r.first_name} ${r.last_name}.`);
          return;
        }
      }
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expirée.");
      setSaving(false);
      return;
    }

    const { data: active } = await supabase
      .from("payrolls")
      .select("id")
      .eq("company_id", user.id)
      .in("status", ["draft", "scheduled", "processing"])
      .limit(1);

    if (active && active.length > 0) {
      setError("Une paie est déjà en cours. Terminez-la dans Suivi.");
      setSaving(false);
      return;
    }

    const { data: payroll, error: pErr } = await supabase
      .from("payrolls")
      .insert({
        company_id: user.id,
        payment_date: paymentDate,
        salary_month: salaryMonth,
        status: "completed",
        employee_count: rows.length,
        total_net: totalNet,
        fees,
        total_deposit: totalDeposit,
        deposit_method: method,
      })
      .select("id")
      .single();

    if (pErr || !payroll) {
      setError(pErr?.message || "Erreur création paie.");
      setSaving(false);
      return;
    }

    const items = rows.map((r, i) => {
      let status: "paid" | "failed" = "paid";
      let fail_reason: string | null = null;
      if (rows.length >= 3 && i === rows.length - 1) {
        status = "failed";
        fail_reason = "Numéro Mobile Money rejeté par l'opérateur";
      }
      const o1 = r.others[0];
      const o2 = r.others[1];
      return {
        payroll_id: payroll.id,
        employee_id: r.id,
        first_name: r.first_name,
        last_name: r.last_name,
        mobile_money: r.mobile_money,
        base_salary: r.base_salary,
        commission: r.commission,
        primes: r.primes,
        transport: r.transport,
        autres: 0,
        retenues: r.retenues,
        other1_label: o1?.label?.trim() || null,
        other1_amount: o1?.amount || 0,
        other2_label: o2?.label?.trim() || null,
        other2_amount: o2?.amount || 0,
        net: rowNet(r),
        status,
        fail_reason,
        retries: 0,
        bulletin_sent: status === "paid",
      };
    });

    const { error: iErr } = await supabase.from("payroll_items").insert(items);
    if (iErr) {
      setError(iErr.message);
      setSaving(false);
      return;
    }

    const hasFail = items.some((x) => x.status === "failed");
    const hasPaid = items.some((x) => x.status === "paid");
    if (hasFail && hasPaid) {
      await supabase.from("payrolls").update({ status: "partial" }).eq("id", payroll.id);
    }

    setDoneId(payroll.id);

    // Tenter FedaPay (si configuré) — sinon simulation locale
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      const fp = await fetch("/api/fedapay/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalDeposit,
          description: `Dépôt paie KoyaPay — ${salaryMonth || paymentDate}`,
          email: u?.email || "",
          payrollId: payroll.id,
        }),
      });
      const fpJson = await fp.json();
      if (fpJson.ok && fpJson.paymentUrl) {
        window.location.href = fpJson.paymentUrl;
        return;
      }
      // 503 = non configuré → on continue en mode simulation
      if (fp.status !== 503 && !fpJson.ok) {
        console.warn("FedaPay:", fpJson.error);
      }
    } catch (err) {
      console.warn("FedaPay indisponible", err);
    }

    setStep(4);
    setSaving(false);
  }

  /** Lignes récap globales non nulles (aperçu) */
  const recapLines = useMemo(() => {
    const sums = {
      base: 0,
      commission: 0,
      primes: 0,
      transport: 0,
      retenues: 0,
    };
    const customMap = new Map<string, number>();
    rows.forEach((r) => {
      sums.base += r.base_salary;
      sums.commission += r.commission;
      sums.primes += r.primes;
      sums.transport += r.transport;
      sums.retenues += r.retenues;
      r.others.forEach((o) => {
        if (o.label.trim() && o.amount) {
          customMap.set(o.label.trim(), (customMap.get(o.label.trim()) || 0) + o.amount);
        }
      });
    });
    const lines: [string, string][] = [];
    if (sums.base) lines.push(["Salaire de base", fmtFcfa(sums.base)]);
    if (sums.commission) lines.push(["Commission", fmtFcfa(sums.commission)]);
    if (sums.primes) lines.push(["Primes", fmtFcfa(sums.primes)]);
    if (sums.transport) lines.push(["Transport", fmtFcfa(sums.transport)]);
    customMap.forEach((amt, label) => lines.push([label, fmtFcfa(amt)]));
    if (sums.retenues) lines.push(["Retenues", "- " + fmtFcfa(sums.retenues)]);
    lines.push(["Employés", String(rows.length)]);
    lines.push(["Frais KoyaPay", fmtFcfa(fees)]);
    return lines;
  }, [rows, fees]);

  if (loading) {
    return <div className="px-5 py-16 text-center text-ink-soft text-sm">Chargement…</div>;
  }

  return (
    <>
      <header className="bg-gradient-to-br from-navy to-navy-2 text-paper px-5 pt-8 pb-5">
        <p className="text-green text-[11.5px] font-bold uppercase tracking-wider mb-1">
          {step < 4 ? `Étape ${step} sur 3` : "Confirmé"}
        </p>
        <h1 className="font-display text-[19px] font-semibold">
          {step === 1 && "Préparez la paie"}
          {step === 2 && "Choisissez la date"}
          {step === 3 && "Récapitulatif & dépôt"}
          {step === 4 && "Paie enregistrée"}
        </h1>
        {step < 4 && (
          <div className="flex gap-1.5 mt-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`flex-1 h-[3px] rounded ${step >= n ? "bg-green" : "bg-white/20"}`} />
            ))}
          </div>
        )}
      </header>

      <main className="px-4 py-4">
        {step === 1 && (
          <>
            <div className="mb-4 bg-white border border-[var(--line)] rounded-2xl p-3.5">
              <label className="block text-xs font-semibold mb-1.5">Salaire du mois de</label>
              <input
                type="month"
                value={salaryMonth}
                onChange={(e) => setSalaryMonth(e.target.value)}
                className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
              />
              <p className="text-[11px] text-ink-soft mt-1.5">
                Affiché sur le bulletin sous « Bulletin de paie » (ex. Septembre 2026).
              </p>
            </div>

            {rows.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-ink-soft">Aucun employé.</p>
                <Link href="/employees" className="inline-block mt-4 bg-green text-navy font-bold text-sm rounded-[11px] px-5 py-3 no-underline">
                  Aller aux employés
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {rows.map((r) => (
                  <div key={r.id} className="bg-white border border-[var(--line)] rounded-2xl overflow-hidden">
                    <button type="button" onClick={() => toggleOpen(r.id)} className="w-full flex items-center gap-3 p-3.5 text-left bg-transparent border-0">
                      <div className="w-9 h-9 rounded-[10px] bg-green-bg text-green-deep flex items-center justify-center font-display font-semibold text-xs">
                        {(r.first_name[0] || "") + (r.last_name[0] || "")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[13.5px] truncate">{r.first_name} {r.last_name}</p>
                        <p className="text-[11px] text-ink-soft">Base {fmtFcfa(r.base_salary)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-[13.5px] font-semibold">{fmtFcfa(rowNet(r))}</p>
                        <p className="text-[9.5px] text-ink-soft">net</p>
                      </div>
                    </button>
                    {r.open && (
                      <div className="px-3.5 pb-3.5 border-t border-[var(--line)] pt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              ["commission", "Commission"],
                              ["primes", "Primes"],
                              ["transport", "Transport"],
                              ["retenues", "Retenues"],
                            ] as const
                          ).map(([key, label]) => (
                            <div key={key}>
                              <label className="block text-[10.5px] font-bold text-ink-soft mb-1">{label}</label>
                              <input
                                type="number"
                                min={0}
                                value={r[key] || ""}
                                onChange={(e) => updateVar(r.id, key, e.target.value)}
                                className="w-full border border-[var(--line)] rounded-lg px-2.5 py-2 text-sm outline-none focus:border-green"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Autres personnalisés */}
                        <div className="pt-1">
                          <p className="text-[10.5px] font-bold text-ink-soft mb-1.5">Autres (max 2)</p>
                          {r.others.map((o, idx) => (
                            <div key={idx} className="flex gap-1.5 mb-1.5 items-center">
                              <input
                                placeholder="Nom (ex: Prime panier)"
                                value={o.label}
                                onChange={(e) => updateOther(r.id, idx, "label", e.target.value)}
                                className="flex-[1.4] border border-[var(--line)] rounded-lg px-2 py-2 text-sm outline-none focus:border-green"
                              />
                              <input
                                type="number"
                                min={0}
                                placeholder="Montant"
                                value={o.amount || ""}
                                onChange={(e) => updateOther(r.id, idx, "amount", e.target.value)}
                                className="flex-1 border border-[var(--line)] rounded-lg px-2 py-2 text-sm outline-none focus:border-green"
                              />
                              <button type="button" onClick={() => removeOther(r.id, idx)} className="w-8 h-8 rounded-lg border border-[var(--line)] text-danger text-sm bg-transparent">
                                ×
                              </button>
                            </div>
                          ))}
                          {r.others.length < 2 && (
                            <button
                              type="button"
                              onClick={() => addOther(r.id)}
                              className="text-[12px] font-bold text-[#1E7A64] bg-transparent border-0 p-0"
                            >
                              + Ajouter un autre élément
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="bg-navy text-paper rounded-2xl px-4 py-3.5 flex justify-between items-center mt-3">
                  <span className="text-[11.5px] text-white/65">Total net</span>
                  <span className="font-display text-[17px] font-semibold">{fmtFcfa(totalNet)}</span>
                </div>

                <button type="button" onClick={() => setStep(2)} className="w-full mt-3 bg-green text-navy font-bold text-sm rounded-[11px] py-3.5 border-0">
                  Continuer
                </button>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Date de paiement</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border border-[var(--line)] rounded-[10px] px-3 py-3 text-sm outline-none focus:border-green"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 bg-paper-2 border border-[var(--line)] rounded-[11px] py-3.5 text-sm font-bold text-ink-soft">
                Retour
              </button>
              <button type="button" onClick={() => setStep(3)} className="flex-[1.4] bg-green text-navy font-bold text-sm rounded-[11px] py-3.5 border-0">
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white border border-[var(--line)] rounded-2xl overflow-hidden">
              {recapLines.map(([a, b], i) => (
                <div key={a + i} className={`flex justify-between px-4 py-2.5 text-sm ${i > 0 ? "border-t border-[var(--line)]" : ""}`}>
                  <span className="text-ink-soft">{a}</span>
                  <span className="font-bold">{b}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3.5 border-t border-[var(--line)] bg-paper-2">
                <span className="font-semibold text-sm">À déposer</span>
                <span className="font-display text-[16px] font-semibold text-[#1E7A64]">{fmtFcfa(totalDeposit)}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2">Moyen de dépôt</p>
              <div className="grid grid-cols-2 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`rounded-xl border-2 py-3 text-[12px] font-bold ${
                      method === m.id ? "border-green bg-green/10 text-green-deep" : "border-[var(--line)] bg-white text-ink-soft"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-paper-2 p-3 text-[12px] text-ink-soft leading-relaxed">
              Dépôt et paiement jour J encore <strong>simulés</strong>. Les bulletins PDF suivent ton modèle.
            </div>

            {error && <p className="text-[12px] text-danger font-medium">{error}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="flex-1 bg-paper-2 border border-[var(--line)] rounded-[11px] py-3.5 text-sm font-bold text-ink-soft">
                Retour
              </button>
              <button type="button" disabled={saving} onClick={confirmPayroll} className="flex-[1.4] bg-green text-navy font-bold text-sm rounded-[11px] py-3.5 border-0 disabled:opacity-60">
                {saving ? "Traitement…" : "Confirmer le dépôt"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-bg text-green-deep flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
            <h2 className="font-display text-[18px] font-semibold mb-2">Dépôt confirmé</h2>
            <p className="text-[13.5px] text-ink-soft leading-relaxed max-w-xs mx-auto">
              Via {method}. Bulletins PDF disponibles dans Suivi pour les employés payés.
            </p>
            <button type="button" onClick={() => router.push("/tracking")} className="w-full mt-6 bg-green text-navy font-bold text-sm rounded-[11px] py-3.5 border-0">
              Voir le suivi
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} className="w-full mt-2 bg-paper-2 border border-[var(--line)] rounded-[11px] py-3.5 text-sm font-bold text-ink-soft">
              Tableau de bord
            </button>
          </div>
        )}
      </main>
    </>
  );
}
