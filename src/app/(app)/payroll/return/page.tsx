"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ReturnContent() {
  const params = useSearchParams();
  const status = params.get("status") || params.get("transaction_status") || "";
  const payroll = params.get("payroll") || "";

  const ok =
    !status ||
    ["approved", "transferred", "success", "paid", "completed"].includes(status.toLowerCase());

  return (
    <div className="px-5 py-16 text-center">
      <div
        className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${
          ok ? "bg-green-bg text-green-deep" : "bg-red-50 text-danger"
        }`}
      >
        {ok ? "✓" : "!"}
      </div>
      <h1 className="font-display text-[19px] font-semibold mb-2">
        {ok ? "Retour de paiement" : "Paiement non confirmé"}
      </h1>
      <p className="text-[13.5px] text-ink-soft max-w-xs mx-auto leading-relaxed">
        {ok
          ? "Si le paiement FedaPay a réussi, votre dépôt est enregistré côté opérateur. Vérifiez le statut dans Suivi."
          : "Le paiement semble annulé ou échoué. Vous pouvez réessayer depuis Paie."}
      </p>
      <div className="mt-6 space-y-2">
        <Link
          href="/tracking"
          className="block bg-green text-navy font-bold text-sm rounded-[11px] py-3.5 no-underline"
        >
          Voir le suivi
        </Link>
        <Link
          href="/payroll"
          className="block bg-paper-2 border border-[var(--line)] rounded-[11px] py-3.5 text-sm font-bold text-ink-soft no-underline"
        >
          Retour à la paie
        </Link>
      </div>
      {payroll && (
        <p className="text-[11px] text-ink-soft mt-4">Réf. paie : {payroll}</p>
      )}
    </div>
  );
}

export default function PayrollReturnPage() {
  return (
    <Suspense fallback={<div className="px-5 py-16 text-center text-sm text-ink-soft">Chargement…</div>}>
      <ReturnContent />
    </Suspense>
  );
}
