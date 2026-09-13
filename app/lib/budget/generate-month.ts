import {findBudgetCategory} from './category-map';
import {parseCsv, serializeCsv} from './csv';
import {formatCentsAsMoney, formatWholeDollars, parseMoney, roundDollars} from './money';
import type {PlTotals} from './pl-parse';

export type BudgetSection = 'carry-forward' | 'income' | 'expenses' | 'other';

export type BudgetRow = {
  cells: string[];
  kind: 'header' | 'section' | 'line' | 'total' | 'blank' | 'other';
  section: BudgetSection;
};

const ACTUALS_COL = 2;
const FALL_COL = 1;

export function parseBudgetCsv(text: string): string[][] {
  return parseCsv(text);
}

export function detectSection(category: string): BudgetSection {
  if (/^CARRY-FORWARD/i.test(category)) return 'carry-forward';
  if (/^INCOME/i.test(category)) return 'income';
  if (/^EXPENSES/i.test(category)) return 'expenses';
  return 'other';
}

function isSectionHeader(category: string): boolean {
  return (
    /^CARRY-FORWARD/i.test(category) || /^INCOME\b/i.test(category) || /^EXPENSES\b/i.test(category)
  );
}

function isTotalRow(cells: string[]): boolean {
  const cat = (cells[0] ?? '').trim();
  if (cat !== '') return false;
  const fall = (cells[FALL_COL] ?? '').trim();
  const actuals = (cells[ACTUALS_COL] ?? '').trim();
  return Boolean(fall || actuals);
}

function classifyRow(cells: string[]): BudgetRow['kind'] {
  const cat = (cells[0] ?? '').trim();
  if (cells.every((c) => !c.trim())) return 'blank';
  if (isSectionHeader(cat)) return 'section';
  if (isTotalRow(cells)) return 'total';
  if (cat) return 'line';
  return 'other';
}

export function annotateBudgetRows(rows: string[][]): BudgetRow[] {
  let section: BudgetSection = 'other';
  return rows.map((cells, index) => {
    const cat = (cells[0] ?? '').trim();
    if (index === 0) {
      return {cells, kind: 'header', section: 'other'};
    }
    if (isSectionHeader(cat)) {
      section = detectSection(cat);
    }
    return {cells, kind: classifyRow(cells), section};
  });
}

/** Short date like 9/12/26 from YYYY-MM-DD. */
export function formatAsOfShort(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return isoDate;
  const year = m[1]?.slice(2);
  const month = String(Number.parseInt(m[2]!, 10));
  const day = String(Number.parseInt(m[3]!, 10));
  return `${month}/${day}/${year}`;
}

export function monthLabelFromId(id: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(id.trim());
  if (!m) return id;
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const idx = Number.parseInt(m[2]!, 10) - 1;
  return `${months[idx] ?? m[2]} ${m[1]}`;
}

function updateAsOfCell(cell: string, asOfShort: string): string {
  if (/Budget Actuals as of/i.test(cell)) {
    return cell.replace(/Budget Actuals as of\s+\S+/i, `Budget Actuals as of ${asOfShort}`);
  }
  return `Budget Actuals as of ${asOfShort}`;
}

function previousActualsMap(annotated: BudgetRow[]): Map<string, number | null> {
  const map = new Map<string, number | null>();
  for (const row of annotated) {
    if (row.kind !== 'line') continue;
    const cat = row.cells[0]?.trim();
    const raw = row.cells[ACTUALS_COL] ?? '';
    map.set(cat, raw.trim() ? parseMoney(raw) : null);
  }
  return map;
}

function buildKeyChanges(
  previousLabel: string,
  prev: Map<string, number | null>,
  next: Map<string, number>,
  incomeCategories: Set<string>,
  expenseCategories: Set<string>,
): string {
  const incomeLines: string[] = [];
  const newExpense: string[] = [];
  const increases: string[] = [];
  const decreases: string[] = [];

  for (const [line, newAmt] of next) {
    const oldRaw = prev.get(line);
    const old = oldRaw == null ? null : roundDollars(oldRaw);
    if (incomeCategories.has(line)) {
      if (old == null && newAmt !== 0) {
        incomeLines.push(`- ${line}: (new) $${newAmt.toLocaleString('en-US')}`);
      } else if (old != null && old !== newAmt) {
        const diff = newAmt - old;
        const sign = diff >= 0 ? '+' : '';
        incomeLines.push(
          `- ${line}: $${old.toLocaleString('en-US')} -> $${newAmt.toLocaleString('en-US')} (${sign}$${diff.toLocaleString('en-US')})`,
        );
      }
      continue;
    }
    if (expenseCategories.has(line)) {
      if ((old == null || old === 0) && newAmt !== 0) {
        newExpense.push(`${line} $${newAmt.toLocaleString('en-US')}`);
      } else if (old != null && newAmt > old) {
        increases.push(
          `${line} $${old.toLocaleString('en-US')}->$${newAmt.toLocaleString('en-US')}`,
        );
      } else if (old != null && newAmt < old) {
        decreases.push(
          `${line} $${old.toLocaleString('en-US')}->$${newAmt.toLocaleString('en-US')}`,
        );
      }
    }
  }

  const parts = [`  Key changes from ${previousLabel}:`, ''];
  if (incomeLines.length) {
    parts.push('  Income:', ...incomeLines, '');
  }
  if (newExpense.length || increases.length || decreases.length) {
    parts.push('  Expenses:');
    if (newExpense.length) parts.push(`  - New activity: ${newExpense.join(', ')}`);
    if (increases.length) parts.push(`  - Increases: ${increases.join(', ')}`);
    if (decreases.length) parts.push(`  - Reclassified: ${decreases.join(', ')}`);
  }
  if (parts.length <= 2) {
    parts.push('  (No material line-item changes vs template.)');
  }
  return parts.join('\n');
}

function formatTotalWithOptionalCents(n: number, templateCell: string): string {
  const rounded = roundDollars(n);
  const abs = Math.abs(rounded);
  const sign = rounded < 0 ? '-' : '';
  if (/\.\d{2}/.test(templateCell)) {
    return abs >= 1000 ? `${sign}$${abs.toLocaleString('en-US')}.00` : `${sign}$${abs}.00`;
  }
  return formatWholeDollars(rounded);
}

function padRow(cells: string[], len: number): string[] {
  const next = [...cells];
  while (next.length < Math.max(len, 4)) next.push('');
  return next;
}

function isStaticCategory(category: string): boolean {
  return (
    /^Initial bank balance/i.test(category) ||
    /cash reserve/i.test(category) ||
    /carry-forward/i.test(category) ||
    /carry forward/i.test(category)
  );
}

export type GenerateMonthInput = {
  asOfDate: string;
  bankBalanceCents: number;
  plActuals: PlTotals;
  previousLabel: string;
  templateCsv: string;
};

export type GenerateMonthResult = {
  applied: Array<{amount: number; category: string}>;
  csv: string;
  unmatchedBudgetLines: string[];
};

/**
 * Build a new monthly budget CSV from a template budget + P&L-derived actuals.
 * Fall Approved / Notes preserved. Non-static lines present in `plActuals` get new actuals;
 * other lines keep template actuals. Section totals recalculated.
 */
export function generateMonthBudget(input: GenerateMonthInput): GenerateMonthResult {
  const rows = parseBudgetCsv(input.templateCsv);
  if (rows.length === 0) {
    throw new Error('Template budget CSV is empty');
  }

  const annotated = annotateBudgetRows(rows);
  const prevActuals = previousActualsMap(annotated);
  const asOfShort = formatAsOfShort(input.asOfDate);

  const lineCategories = annotated.filter((r) => r.kind === 'line').map((r) => r.cells[0]?.trim());

  const incomeCategories = new Set(
    annotated
      .filter((r) => r.kind === 'line' && r.section === 'income')
      .map((r) => r.cells[0]?.trim()),
  );
  const expenseCategories = new Set(
    annotated
      .filter((r) => r.kind === 'line' && r.section === 'expenses')
      .map((r) => r.cells[0]?.trim()),
  );

  const nextActuals = new Map<string, number>();
  const applied: Array<{amount: number; category: string}> = [];
  const unmatchedBudgetLines: string[] = [];

  for (const [budgetLine, amount] of input.plActuals) {
    const category = findBudgetCategory(lineCategories, budgetLine);
    if (!category) {
      unmatchedBudgetLines.push(budgetLine);
      continue;
    }
    if (isStaticCategory(category)) continue;
    nextActuals.set(category, amount);
    applied.push({amount, category});
  }

  let carryForwardActuals = 0;
  for (const row of annotated) {
    if (row.kind !== 'line' || row.section !== 'carry-forward') continue;
    const amt =
      parseMoney(row.cells[ACTUALS_COL] ?? '') ?? parseMoney(row.cells[FALL_COL] ?? '') ?? 0;
    carryForwardActuals += roundDollars(amt);
  }
  const availableCents = input.bankBalanceCents - carryForwardActuals * 100;

  const header = padRow([...(rows[0] ?? [])], 4);
  header[1] = `current balance ${formatCentsAsMoney(input.bankBalanceCents)}`;
  header[2] = `available for expenses ${formatCentsAsMoney(availableCents)}`;
  header[3] = buildKeyChanges(
    input.previousLabel,
    prevActuals,
    nextActuals,
    incomeCategories,
    expenseCategories,
  );

  const out: string[][] = [header];
  let sectionFall = 0;
  let sectionActual = 0;

  for (let i = 1; i < annotated.length; i++) {
    const row = annotated[i]!;
    const cells = padRow([...row.cells], rows[i]?.length ?? 4);

    if (row.kind === 'section') {
      sectionFall = 0;
      sectionActual = 0;
      cells[ACTUALS_COL] = updateAsOfCell(cells[ACTUALS_COL] ?? '', asOfShort);
      out.push(cells);
      continue;
    }

    if (row.kind === 'blank' || row.kind === 'other') {
      out.push(cells);
      continue;
    }

    if (row.kind === 'line') {
      const cat = cells[0]?.trim();
      const fall = parseMoney(cells[FALL_COL] ?? '') ?? 0;
      sectionFall += roundDollars(fall);

      if (!isStaticCategory(cat) && nextActuals.has(cat)) {
        const nextAmt = nextActuals.get(cat);
        if (nextAmt != null) {
          cells[ACTUALS_COL] = formatWholeDollars(nextAmt);
        }
      }

      const actualNum = parseMoney(cells[ACTUALS_COL] ?? '');
      if (actualNum != null) sectionActual += roundDollars(actualNum);
      out.push(cells);
      continue;
    }

    if (row.kind === 'total') {
      cells[FALL_COL] = formatTotalWithOptionalCents(sectionFall, rows[i]?.[FALL_COL] ?? '');
      cells[ACTUALS_COL] = formatTotalWithOptionalCents(
        sectionActual,
        rows[i]?.[ACTUALS_COL] ?? '',
      );
      out.push(cells);
      sectionFall = 0;
      sectionActual = 0;
    }
  }

  return {
    applied,
    csv: serializeCsv(out),
    unmatchedBudgetLines,
  };
}
