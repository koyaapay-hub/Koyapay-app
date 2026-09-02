"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (err) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <div className="bg-gradient-to-br from-navy to-navy-2 text-paper px-5 pt-8 pb-6">
        <p className="text-green text-[11.5px] font-bold uppercase tracking-wider mb-1">Connexion</p>
        <h1 className="font-display text-[19px] font-semibold">Bon retour sur KoyaPay</h1>
        <p className="text-[12.5px] text-white/65 mt-1.5 leading-relaxed">
          Connectez-vous avec l&apos;email et le mot de passe de votre compte entreprise.
        </p>
      </div>

      <div className="flex-1 px-5 py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Votre mot de passe"
              required
              minLength={6}
              className="w-full border border-[var(--line)] rounded-[10px] px-3 py-3 text-sm outline-none focus:border-green focus:ring-2 focus:ring-green/20"
            />
          </div>

          {error && (
            <p className="text-[12px] text-danger font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green hover:bg-green-deep text-navy font-bold text-sm rounded-[11px] py-3.5 transition disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-[13px] text-ink-soft mt-5">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-[#1E7A64] font-bold hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </>
  );
}
