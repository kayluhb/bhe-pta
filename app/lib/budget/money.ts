/** Parse money strings like `$1,234.56`, `1234.56`, `($12.00)` into number. */
export function parseMoney(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  let trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  const negative = /^\(.*\)$/.test(trimmed) || trimmed.startsWith('-');
  const cleaned = trimmed.replace(/[$,()\s]/g, '');
  if (!cleaned || cleaned === '-') return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}

/** Whole-dollar budget line amounts. */
export function roundDollars(n: number): number {
  return Math.round(n);
}

/** Format whole dollars for budget cells (no surrounding CSV quotes). */
export function formatWholeDollars(n: number): string {
  const rounded = roundDollars(n);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  if (abs >= 1000) {
    return `${sign}$${abs.toLocaleString('en-US')}`;
  }
  return `${sign}$${abs}`;
}

/** Format balance/available header amounts with cents. */
export function formatCentsAsMoney(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  const body =
    dollars >= 1000
      ? `$${dollars.toLocaleString('en-US')}.${rem.toString().padStart(2, '0')}`
      : `$${dollars}.${rem.toString().padStart(2, '0')}`;
  return negative ? `-${body}` : body;
}

export function parseBankBalanceToCents(raw: string): number | null {
  const n = parseMoney(raw);
  if (n == null) return null;
  return Math.round(n * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}
