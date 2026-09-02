"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const e = sessionStorage.getItem("kp_email") || "";
    setEmail(e);
    if (!e) router.replace("/register");
  }, [router]);

  function handleChange(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const token = digits.join("");
    if (token.length !== 6) {
      setError("Entrez les 6 chiffres du code.");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    setLoading(false);
    if (err) {
      setError("Code incorrect ou expiré. Réessayez.");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  async function handleResend() {
    setResendMsg("");
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.resend({ type: "signup", email });
    if (err) setError("Impossible de renvoyer le code. Réessayez plus tard.");
    else setResendMsg("Nouveau code envoyé par email.");
  }

  return (
    <>
      <div className="bg-gradient-to-br from-navy to-navy-2 text-paper px-5 pt-8 pb-6">
        <p className="text-green text-[11.5px] font-bold uppercase tracking-wider mb-1">Étape 2 sur 3</p>
        <h1 className="font-display text-[19px] font-semibold">Vérifiez votre email</h1>
        <p className="text-[12.5px] text-white/65 mt-1.5 leading-relaxed">
          Code envoyé par email à <strong className="text-white">{email || "…"}</strong>
        </p>
        <div className="flex gap-1.5 mt-4">
          <div className="flex-1 h-[3px] rounded bg-green" />
          <div className="flex-1 h-[3px] rounded bg-green" />
          <div className="flex-1 h-[3px] rounded bg-white/20" />
        </div>
      </div>

      <div className="flex-1 px-5 py-5">
        <form onSubmit={handleVerify}>
          <div className="flex gap-2 justify-between">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-semibold border border-[var(--line)] rounded-[10px] outline-none focus:border-green focus:ring-2 focus:ring-green/20"
              />
            ))}
          </div>

          {error && <p className="text-[12px] text-danger font-medium mt-3">{error}</p>}
          {resendMsg && <p className="text-[12px] text-green-deep font-medium mt-3">{resendMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green hover:bg-green-deep text-navy font-bold text-sm rounded-[11px] py-3.5 mt-5 transition disabled:opacity-60"
          >
            {loading ? "Vérification…" : "Vérifier le code"}
          </button>
        </form>

        <div className="flex justify-between items-center mt-4 text-[12.5px] text-ink-soft">
          <span>Pas reçu ?</span>
          <button type="button" onClick={handleResend} className="text-[#1E7A64] font-bold">
            Renvoyer le code
          </button>
        </div>
      </div>
    </>
  );
}
