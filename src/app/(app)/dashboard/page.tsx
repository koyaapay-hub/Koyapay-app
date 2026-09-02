import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("companies")
    .select("name, email, balance, onboarding_done")
    .eq("id", user.id)
    .single();

  if (company && !company.onboarding_done) redirect("/onboarding");

  const { count } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("company_id", user.id);

  const balance = Number(company?.balance || 0);

  return (
    <>
      <header className="bg-gradient-to-br from-navy to-navy-2 text-paper px-5 pt-8 pb-6">
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="text-green text-[11.5px] font-bold uppercase tracking-wider mb-1">Tableau de bord</p>
            <h1 className="font-display text-[19px] font-semibold leading-tight">
              {company?.name || "Mon entreprise"}
            </h1>
            <p className="text-[12.5px] text-white/65 mt-1">{user.email}</p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="bg-white/10 rounded-xl px-3 py-3">
            <p className="text-[10px] text-white/55">Solde KoyaPay</p>
            <p className="font-display text-[16px] font-semibold mt-0.5">
              {balance.toLocaleString("fr-FR")} FCFA
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-3">
            <p className="text-[10px] text-white/55">Employés</p>
            <p className="font-display text-[16px] font-semibold mt-0.5">{count ?? 0}</p>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 space-y-3">
        <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-soft">Raccourcis</p>

        <Link href="/employees" className="block bg-white border border-[var(--line)] rounded-2xl p-4 no-underline text-ink">
          <p className="font-semibold text-sm">Employés</p>
          <p className="text-[12.5px] text-ink-soft mt-1">
            {(count ?? 0) === 0
              ? "Ajoutez votre premier employé pour préparer une paie."
              : `${count} employé${(count ?? 0) > 1 ? "s" : ""} enregistré${(count ?? 0) > 1 ? "s" : ""}.`}
          </p>
        </Link>

        <Link href="/payroll" className="block bg-white border border-[var(--line)] rounded-2xl p-4 no-underline text-ink">
          <p className="font-semibold text-sm">Préparer une paie</p>
          <p className="text-[12.5px] text-ink-soft mt-1">
            Primes, retenues, date de paiement et dépôt.
          </p>
        </Link>

        <Link href="/tracking" className="block bg-white border border-[var(--line)] rounded-2xl p-4 no-underline text-ink">
          <p className="font-semibold text-sm">Suivi des paiements</p>
          <p className="text-[12.5px] text-ink-soft mt-1">
            Statuts payé / en attente / échec et relances.
          </p>
        </Link>
      </main>
    </>
  );
}
