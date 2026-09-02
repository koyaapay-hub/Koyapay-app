"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Entrez le nom de l'entreprise.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { error: err } = await supabase
      .from("companies")
      .update({
        name: name.trim(),
        whatsapp: whatsapp.replace(/\D/g, "") || null,
        onboarding_done: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <div className="bg-gradient-to-br from-navy to-navy-2 text-paper px-5 pt-8 pb-6">
        <p className="text-green text-[11.5px] font-bold uppercase tracking-wider mb-1">Étape 3 sur 3</p>
        <h1 className="font-display text-[19px] font-semibold">Votre entreprise</h1>
        <p className="text-[12.5px] text-white/65 mt-1.5 leading-relaxed">
          Ces infos apparaîtront sur les bulletins de paie de vos employés.
        </p>
        <div className="flex gap-1.5 mt-4">
          <div className="flex-1 h-[3px] rounded bg-green" />
          <div className="flex-1 h-[3px] rounded bg-green" />
          <div className="flex-1 h-[3px] rounded bg-green" />
        </div>
      </div>

      <div className="flex-1 px-5 py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Nom de l&apos;entreprise *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Atlas Textile SARL"
              required
              className="w-full border border-[var(--line)] rounded-[10px] px-3 py-3 text-sm outline-none focus:border-green focus:ring-2 focus:ring-green/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">WhatsApp entreprise</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="01 62 43 47 07"
              inputMode="numeric"
              className="w-full border border-[var(--line)] rounded-[10px] px-3 py-3 text-sm outline-none focus:border-green focus:ring-2 focus:ring-green/20"
            />
            <p className="text-[11.5px] text-ink-soft mt-1.5">
              Optionnel — pour recevoir les notifications KoyaPay.
            </p>
          </div>

          <div className="rounded-xl bg-paper-2 p-3.5 text-[12px] text-ink-soft leading-relaxed">
            Vous pourrez ajouter le <strong>cachet</strong> et la <strong>signature</strong> plus tard dans les paramètres.
          </div>

          {error && <p className="text-[12px] text-danger font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green hover:bg-green-deep text-navy font-bold text-sm rounded-[11px] py-3.5 transition disabled:opacity-60"
          >
            {loading ? "Enregistrement…" : "Accéder à KoyaPay"}
          </button>
        </form>
      </div>
    </>
  );
}
