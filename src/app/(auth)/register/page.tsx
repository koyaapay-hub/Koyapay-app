"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function RegisterPage() {
  const router = useRouter();
  const [indicatif, setIndicatif] = useState("+229");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation simple
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      setError("Entrez un numéro de téléphone valide.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone: digits,
          phone_country: indicatif,
        },
        emailRedirectTo: undefined,
      },
    });

    setLoading(false);

    if (err) {
      if (err.message.toLowerCase().includes("already")) {
        setError("Un compte existe déjà avec cet email.");
      } else {
        setError(err.message);
      }
      return;
    }

    // Supabase envoie un email de confirmation par défaut
    // On redirige vers verify pour saisir le code OTP email
    sessionStorage.setItem("kp_email", email);
    sessionStorage.setItem("kp_phone", indicatif + " " + phone);
    router.push("/verify");
  }

  return (
    <>
      <div className="bg-gradient-to-br from-navy to-navy-2 text-paper px-5 pt-8 pb-6">
        <p className="text-green text-[11.5px] font-bold uppercase tracking-wider mb-1">Étape 1 sur 3</p>
        <h1 className="font-display text-[19px] font-semibold">Créer votre compte</h1>
        <p className="text-[12.5px] text-white/65 mt-1.5 leading-relaxed">
          Renseignez vos informations pour commencer à payer vos équipes en un seul dépôt.
        </p>
        <div className="flex gap-1.5 mt-4">
          <div className="flex-1 h-[3px] rounded bg-green" />
          <div className="flex-1 h-[3px] rounded bg-white/20" />
          <div className="flex-1 h-[3px] rounded bg-white/20" />
        </div>
      </div>

      <div className="flex-1 px-5 py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Téléphone</label>
            <div className="flex gap-2">
              <select
                value={indicatif}
                onChange={(e) => setIndicatif(e.target.value)}
                className="max-w-[108px] border border-[var(--line)] rounded-[10px] px-2 py-3 text-sm outline-none focus:border-green"
              >
                <option value="+229">🇧🇯 +229</option>
                <option value="+225">🇨🇮 +225</option>
                <option value="+221">🇸🇳 +221</option>
                <option value="+33">🇫🇷 +33</option>
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01 62 43 47 07"
                inputMode="numeric"
                required
                className="flex-1 border border-[var(--line)] rounded-[10px] px-3 py-3 text-sm outline-none focus:border-green focus:ring-2 focus:ring-green/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">Email professionnel</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@entreprise.com"
              required
              className="w-full border border-[var(--line)] rounded-[10px] px-3 py-3 text-sm outline-none focus:border-green focus:ring-2 focus:ring-green/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              required
              minLength={8}
              className="w-full border border-[var(--line)] rounded-[10px] px-3 py-3 text-sm outline-none focus:border-green focus:ring-2 focus:ring-green/20"
            />
            <p className="text-[11.5px] text-ink-soft mt-1.5">
              Au moins 8 caractères, idéalement avec majuscule, chiffre et symbole.
            </p>
          </div>

          {error && <p className="text-[12px] text-danger font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green hover:bg-green-deep text-navy font-bold text-sm rounded-[11px] py-3.5 transition disabled:opacity-60"
          >
            {loading ? "Création…" : "Continuer"}
          </button>
        </form>

        <p className="text-center text-[13px] text-ink-soft mt-5">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-[#1E7A64] font-bold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </>
  );
}
