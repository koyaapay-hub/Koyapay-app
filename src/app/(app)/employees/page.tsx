"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile_money: string;
  whatsapp: string | null;
  base_salary: number;
  cnss: boolean;
};

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  mobile_money: "",
  whatsapp: "",
  base_salary: "",
  cnss: false,
};

function initials(first: string, last: string) {
  return `${(first[0] || "").toUpperCase()}${(last[0] || "").toUpperCase()}` || "?";
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("fr-FR") + " FCFA";
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error: err } = await supabase
      .from("employees")
      .select("*")
      .eq("company_id", user.id)
      .order("last_name", { ascending: true });
    if (!err && data) setEmployees(data as Employee[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(e: Employee) {
    setEditingId(e.id);
    setForm({
      first_name: e.first_name,
      last_name: e.last_name,
      email: e.email || "",
      mobile_money: e.mobile_money,
      whatsapp: e.whatsapp || "",
      base_salary: String(e.base_salary || ""),
      cnss: e.cnss,
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("Nom et prénom obligatoires.");
      return;
    }
    const momo = form.mobile_money.replace(/\D/g, "");
    if (momo.length < 8) {
      setError("Numéro Mobile Money invalide.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expirée. Reconnectez-vous.");
      setSaving(false);
      return;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      mobile_money: momo,
      whatsapp: form.whatsapp.replace(/\D/g, "") || momo,
      base_salary: parseFloat(form.base_salary) || 0,
      cnss: form.cnss,
      company_id: user.id,
      updated_at: new Date().toISOString(),
    };

    let err;
    if (editingId) {
      ({ error: err } = await supabase.from("employees").update(payload).eq("id", editingId));
    } else {
      ({ error: err } = await supabase.from("employees").insert(payload));
    }

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet employé ?")) return;
    const supabase = createClient();
    await supabase.from("employees").delete().eq("id", id);
    load();
  }

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      e.first_name.toLowerCase().includes(q) ||
      e.last_name.toLowerCase().includes(q) ||
      e.mobile_money.includes(q)
    );
  });

  return (
    <>
      <header className="bg-gradient-to-br from-navy to-navy-2 text-paper px-5 pt-8 pb-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-green text-[11.5px] font-bold uppercase tracking-wider mb-1">Équipe</p>
            <h1 className="font-display text-[19px] font-semibold">Employés</h1>
            <p className="text-[12.5px] text-white/65 mt-1">
              {employees.length} personne{employees.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="w-10 h-10 rounded-[11px] bg-green text-navy flex items-center justify-center text-xl font-bold border-0"
            aria-label="Ajouter"
          >
            +
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-[11px] px-3 py-2.5">
          <span className="text-white/50 text-sm">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="flex-1 bg-transparent border-0 outline-none text-sm text-paper placeholder:text-white/40"
          />
        </div>
      </header>

      <main className="px-4 py-4 space-y-2.5">
        {loading && (
          <p className="text-center text-ink-soft text-sm py-10">Chargement…</p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-14 text-ink-soft">
            <p className="text-3xl mb-2 opacity-40">👥</p>
            <p className="text-sm">
              {search ? "Aucun résultat." : "Aucun employé pour l’instant."}
            </p>
            {!search && (
              <button
                onClick={openAdd}
                className="mt-4 bg-green text-navy font-bold text-sm rounded-[11px] px-5 py-2.5 border-0"
              >
                Ajouter le premier
              </button>
            )}
          </div>
        )}

        {filtered.map((e) => (
          <div key={e.id} className="bg-white border border-[var(--line)] rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-green-bg text-green-deep flex items-center justify-center font-display font-semibold text-sm flex-shrink-0">
              {initials(e.first_name, e.last_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13.5px] truncate">
                {e.first_name} {e.last_name}
              </p>
              <p className="text-[11.5px] text-ink-soft">{e.mobile_money}</p>
              <p className="font-display text-[13px] font-semibold mt-0.5">{fmt(e.base_salary)}</p>
              {e.cnss && (
                <span className="inline-block mt-1 text-[10px] font-bold bg-green-bg text-green-deep px-2 py-0.5 rounded-full">
                  CNSS
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => openEdit(e)}
                className="w-8 h-8 rounded-lg border border-[var(--line)] bg-paper-2 text-ink-soft text-xs"
              >
                ✎
              </button>
              <button
                onClick={() => handleDelete(e.id)}
                className="w-8 h-8 rounded-lg border border-[var(--line)] bg-paper-2 text-danger text-xs"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </main>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-navy/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-paper w-full max-w-[420px] rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-[17px] font-semibold">
                {editingId ? "Modifier l’employé" : "Nouvel employé"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-paper-2 border-0 text-ink-soft"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Prénom *</label>
                  <input
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Nom *</label>
                  <input
                    required
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Mobile Money (+229) *</label>
                <input
                  required
                  inputMode="numeric"
                  placeholder="01 XX XX XX XX"
                  value={form.mobile_money}
                  onChange={(e) => setForm({ ...form, mobile_money: e.target.value })}
                  className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">WhatsApp</label>
                <input
                  inputMode="numeric"
                  placeholder="Par défaut = Mobile Money"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Salaire de base (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={form.base_salary}
                  onChange={(e) => setForm({ ...form, base_salary: e.target.value })}
                  className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-green"
                />
              </div>

              <label className="flex items-center gap-2 text-[13px] text-ink-soft cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.cnss}
                  onChange={(e) => setForm({ ...form, cnss: e.target.checked })}
                />
                Affilié CNSS
              </label>

              {error && <p className="text-[12px] text-danger font-medium">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-green hover:bg-green-deep text-navy font-bold text-sm rounded-[11px] py-3.5 border-0 disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
