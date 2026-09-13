import {mapPlTotal} from './category-map';
import {parseCsv} from './csv';
import {parseMoney, roundDollars} from './money';

export type PlTotals = Map<string, number>;

/**
 * Extract mapped budget-line totals from a QuickBooks Profit and Loss Detail CSV.
 * Keys are budget line names from the category map; values are rounded whole dollars.
 */
export function extractPlBudgetActuals(plCsvText: string): {
  actuals: PlTotals;
  unmappedTotals: Array<{amount: number; leaf: string; path: string[]}>;
} {
  const rows = parseCsv(plCsvText);
  const path: string[] = [];
  const actuals: PlTotals = new Map();
  const unmappedTotals: Array<{amount: number; leaf: string; path: string[]}> = [];

  for (const row of rows) {
    const first = (row[0] ?? '').trim();
    if (!first) {
      // Transaction rows often have empty first column; skip
      continue;
    }

    if (first.startsWith('Total for ')) {
      let leaf = first.slice('Total for '.length).trim();
      // QB sometimes appends " with sub-accounts" on the Total line itself
      const amount = parseMoney(row[9] ?? row[row.length - 2] ?? '');
      if (amount == null) continue;

      // Align path: pop until leaf matches stack top (allow truncated names)
      while (path.length > 0) {
        const top = path[path.length - 1];
        if (top == null) break;
        if (
          top === leaf ||
          leaf.startsWith(top) ||
          top.startsWith(leaf.replace(/ with sub-accounts$/i, ''))
        ) {
          break;
        }
        // If leaf is "X with sub-accounts", try matching X
        const bare = leaf.replace(/ with sub-accounts$/i, '');
        if (top === bare || top.startsWith(bare) || bare.startsWith(top)) {
          leaf = bare;
          break;
        }
        path.pop();
      }

      const fullPath = path.length > 0 ? [...path] : [leaf.replace(/ with sub-accounts$/i, '')];
      // Ensure leaf is last path element
      const normalizedLeaf = leaf.replace(/ with sub-accounts$/i, '');
      if (fullPath[fullPath.length - 1] !== normalizedLeaf) {
        // path still has the account; use as-is
      }

      const mapped = mapPlTotal(fullPath);
      if (!mapped) {
        // Try with just leaf if path mapping failed for roll-ups we still want
        const leafOnly = mapPlTotal([normalizedLeaf]);
        if (leafOnly) {
          applyMapped(actuals, leafOnly.budgetLine, amount, leafOnly.additive);
        } else if (!/with sub-accounts$/i.test(leaf)) {
          unmappedTotals.push({amount, leaf: normalizedLeaf, path: fullPath});
        }
      } else {
        applyMapped(actuals, mapped.budgetLine, amount, mapped.additive);
      }

      // Pop the closed account
      if (path.length > 0) path.pop();
      continue;
    }

    // Section / account header: first cell text, no transaction date in col 1
    const txnDate = (row[1] ?? '').trim();
    const looksLikeHeader =
      !txnDate &&
      !/^Ordinary Income\/Expenses$/i.test(first) &&
      !/^Cash Basis/i.test(first) &&
      first !== 'Income' &&
      first !== 'Expenses' &&
      !/^Other Income\/Expense$/i.test(first) &&
      !/^Other Income$/i.test(first) &&
      !/^Other Expense$/i.test(first) &&
      !/^Profit and Loss Detail$/i.test(first) &&
      !/^Barton Hills/i.test(first) &&
      !/^\d/.test(first); // date ranges like July 1-...

    // Date range lines / titles
    if (
      /^(January|February|March|April|May|June|July|August|September|October|November|December)/i.test(
        first,
      )
    ) {
      continue;
    }

    if (looksLikeHeader) {
      // Don't push roll-up-only labels that aren't real accounts? Still push for path context.
      if (first === 'Income' || first === 'Expenses') {
        path.length = 0;
        path.push(first);
        continue;
      }
      path.push(first);
    }
  }

  return {actuals, unmappedTotals};
}

function applyMapped(
  actuals: PlTotals,
  budgetLine: string,
  amount: number,
  additive?: boolean,
): void {
  const rounded = roundDollars(amount);
  if (additive) {
    actuals.set(budgetLine, (actuals.get(budgetLine) ?? 0) + rounded);
  } else {
    actuals.set(budgetLine, rounded);
  }
}
