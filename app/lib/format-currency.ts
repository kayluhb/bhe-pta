/** USD for UI: grouping, 2 fraction digits (e.g. $1,234.56). */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(Number(amount));
}
