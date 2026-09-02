"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type Form = {
  name: string;
  director_name: string;
  phone: string;
  company_email: string;
  company_address: string;
  whatsapp: string;
  logo_url: string;
  stamp_url: string;
  signature_url: string;
};

const empty: Form = {
  name: "",
  director_name: "",
  phone: "",
  company_email: "",
  company_address: "",
  whatsapp: "",
  logo_url: "",
  stamp_url: "",
  signature_url: "",
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 800_000) {
      reject(new Error("Image trop lourde (max ~800 Ko). Compressez-la."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<Form>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setEmail(user.email || "");
    const { data } = await supabase
      .from("companies")
      .select("name, director_name, phone, company_email, company_address, whatsapp, logo_url, stamp_url, signature_url, email")
      .eq("id", user.id)
      .single();
    if (data) {
      setForm({
        name: data.name || "",
        director_name: data.director_name || "",
        phone: data.phone || "",
        company_email: data.company_email || "",
        company_address: data.company_address || "",
        whatsapp: data.whatsapp || "",
        logo_url: data.logo_url || "",
        stamp_url: data.stamp_url || "",
        signature_url: data.signature_url || "",
      });
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function onImage(field: "logo_url" | "stamp_url" | "signature_url", file: File | null) {
    if (!file) return;
    setError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((f) => ({ ...f, [field]: dataUrl }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur image");
    }
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!form.name.trim()) {
      setError("Le nom de l’entreprise est obligatoire.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase
      .from("companies")
      .update({
        name: form.name.trim(),
        director_name: form.director_name.trim() || null,
        phone: form.phone.replace(/\D/g, "") || null,
        company_email: form.company_email.trim() || null,
        company_address: form.company_address.trim() || null,
        whatsapp: form.whatsapp.replace(/\D/g, "") || null,
        logo_url: form.logo_url || null,
        stamp_url: form.stamp_url || null,
        signature_url: form.signature_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);
    if (err) setError(err.message);
    else {
      setMsg("Modifications enregistrées.");
      load();
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="px-5 py-16 text-center text-ink-soft text-sm">Chargement…</div>;
  }

  return (
    <>
      <header className="bg-gradient-to-br from-navy to-navy-2 text-paper px-5 pt-8 pb-6">
        <p className="text-green text-[11.5px] font-bold uppercase tracking-wider mb-1">Compte</p>
        <h1 className="font-display text-[19px] font-semibold">Réglages</h1>
        <p className="text-[12.5px] text-white/65 mt-1">{email}</p>
      </header>

      <main className="px-4 py-5 space-y-4">
        <form onSubmit={saveCompany} className="bg-white border border-[var(--line)] rounded-2xl p-4 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">Entreprise</p>

          <div>
            <label className="block text-xs font-semibold mb-1">Nom de l&apos;entreprise *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Nom du directeur général</label>
            <input
              value={form.director_name}
              onChange={(e) => setForm({ ...form, director_name: e.target.value })}
              placeholder="Par défaut : nom de l’entreprise"
              className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Adresse de l&apos;entreprise</label>
            <input
              value={form.company_address}
              onChange={(e) => setForm({ ...form, company_address: e.target.value })}
              placeholder="Quartier, ville…"
              className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
            />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft pt-1">Contact de l&apos;entreprise</p>

          <div>
            <label className="block text-xs font-semibold mb-1">Téléphone entreprise</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              inputMode="numeric"
              placeholder="Pris par défaut si renseigné à l’inscription"
              className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Email entreprise</label>
            <input
              type="email"
              value={form.company_email}
              onChange={(e) => setForm({ ...form, company_email: e.target.value })}
              placeholder="Optionnel"
              className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">WhatsApp</label>
            <input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              inputMode="numeric"
              className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
            />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft pt-1">Identité visuelle (optionnel)</p>
          <p className="text-[11.5px] text-ink-soft -mt-1">
            Logo, cachet et signature : s’ils sont vides, ils n’apparaissent pas sur le bulletin.
          </p>

          {(
            [
              ["logo_url", "Logo entreprise"],
              ["stamp_url", "Cachet"],
              ["signature_url", "Signature"],
            ] as const
          ).map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs font-semibold mb-1">{label}</label>
              <div className="flex items-center gap-3">
                {form[field] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form[field]} alt={label} className="w-12 h-12 object-contain rounded-lg border border-[var(--line)] bg-paper-2" />
                ) : (
                  <div className="w-12 h-12 rounded-lg border border-dashed border-[var(--line)] bg-paper-2" />
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onImage(field, e.target.files?.[0] || null)}
                    className="text-[12px] w-full"
                  />
                  {form[field] && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, [field]: "" })}
                      className="text-[11px] text-danger font-semibold mt-1 bg-transparent border-0 p-0"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {error && <p className="text-[12px] text-danger font-medium">{error}</p>}
          {msg && <p className="text-[12px] text-green-deep font-medium">{msg}</p>}

          <button type="submit" disabled={saving} className="w-full bg-green text-navy font-bold text-sm rounded-[11px] py-3 border-0 disabled:opacity-60">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>

        <div className="bg-white border border-[var(--line)] rounded-2xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft mb-2">Sécurité</p>
          <button type="button" onClick={logout} className="w-full border border-danger text-danger font-bold text-sm rounded-[11px] py-3 bg-transparent">
            Se déconnecter
          </button>
        </div>

        <p className="text-center text-[11px] text-ink-soft pb-2 space-x-2">
          <a href="/cgu" className="underline">CGU</a>
          <span>·</span>
          <a href="/confidentialite" className="underline">Confidentialité</a>
          <span>·</span>
          <span>KoyaPay · Bénin · 2026</span>
        </p>
      </main>
    </>
  );
}
