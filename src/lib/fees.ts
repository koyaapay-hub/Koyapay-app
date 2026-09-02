/** Grille tarifaire KoyaPay (frais tout compris) */
export function computeFees(totalNet: number, employeeCount: number): number {
  if (totalNet <= 0) return 0;
  if (totalNet <= 500_000) return Math.round(totalNet * 0.007);
  if (totalNet <= 1_000_000) return Math.round(totalNet * 0.005 + 50 * employeeCount);
  return Math.round(totalNet * 0.004 + 50 * employeeCount);
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

/** Espace classique entre milliers (jamais de slash / espace fine Unicode) */
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
