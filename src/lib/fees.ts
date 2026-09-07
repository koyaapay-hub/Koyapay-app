/** Grille tarifaire KoyaPay (septembre 2026) */
export function computeFees(totalNet: number, employeeCount: number): number {
  const n = Math.max(0, Number(employeeCount) || 0);
  const m = Math.max(0, Number(totalNet) || 0);
  if (m < 50_000) {
    // sous le plancher affiché : appliquer le 1er palier
    return Math.round(m * 0.01 + 100 * n);
  }
  if (m <= 500_000) return Math.round(m * 0.01 + 100 * n);
  if (m <= 5_000_000) return Math.round(m * 0.008 + 200 * n);
  if (m <= 10_000_000) return Math.round(m * 0.007 + 300 * n);
  if (m <= 25_000_000) return Math.round(m * 0.006 + 400 * n);
  return Math.round(m * 0.005 + 550 * n);
}

export type PayVars = {
  base_salary?: number;
  commission?: number;
  primes?: number;
  transport?: number;
  retenues?: number;
  other1_amount?: number;
  other2_amount?: number;
  autres?: number;
};

export function computeNet(row: PayVars): number {
  const base = Number(row.base_salary || 0);
  const commission = Number(row.commission || 0);
  const primes = Number(row.primes || 0);
  const transport = Number(row.transport || 0);
  const other1 = Number(row.other1_amount || 0);
  const other2 = Number(row.other2_amount || 0);
  const legacyAutres = Number(row.autres || 0);
  const retenues = Number(row.retenues || 0);
  return Math.max(
    base + commission + primes + transport + other1 + other2 + legacyAutres - retenues,
    0
  );
}

export function fmtAmount(n: number): string {
  const v = Math.round(Number(n) || 0);
  const neg = v < 0;
  const s = String(Math.abs(v));
  const parts: string[] = [];
  for (let i = s.length; i > 0; i -= 3) {
    parts.unshift(s.slice(Math.max(0, i - 3), i));
  }
  return (neg ? "-" : "") + parts.join(" ");
}

export function fmtFcfa(n: number): string {
  return fmtAmount(n) + " FCFA";
}
