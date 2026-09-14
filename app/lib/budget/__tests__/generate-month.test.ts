import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';

import {mapPlTotal} from '../category-map';
import {parseCsv, serializeCsv} from '../csv';
import {formatAsOfShort, generateMonthBudget, monthLabelFromId} from '../generate-month';
import {formatCentsAsMoney, parseBankBalanceToCents, parseMoney, roundDollars} from '../money';
import {extractPlBudgetActuals} from '../pl-parse';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('budget csv helpers', () => {
  it('round-trips quoted multiline fields', () => {
    const rows = [
      ['Title', 'balance', 'available', 'line1\nline2'],
      ['Category', '$100', '$50', 'note'],
    ];
    const text = serializeCsv(rows);
    expect(parseCsv(text)).toEqual(rows);
  });

  it('parses and formats money', () => {
    expect(parseMoney('"$33,252.25"')).toBe(33252.25);
    expect(parseMoney('$151.23')).toBe(151.23);
    expect(roundDollars(151.23)).toBe(151);
    expect(parseBankBalanceToCents('$137,289.55')).toBe(13728955);
    expect(formatCentsAsMoney(13728955)).toBe('$137,289.55');
    expect(formatAsOfShort('2026-09-12')).toBe('9/12/26');
    expect(monthLabelFromId('2026-09')).toBe('September 2026');
  });
});

describe('mapPlTotal fundraiser additive lines', () => {
  it('marks carnival and spring fling income and expenses as additive on the same budget lines', () => {
    expect(mapPlTotal(['Carnival Income'])).toEqual({
      additive: true,
      budgetLine: 'Fundraiser #1 (Carnival)',
    });
    expect(mapPlTotal(['Carnival Expenses'])).toEqual({
      additive: true,
      budgetLine: 'Fundraiser #1 (Carnival)',
    });
    expect(mapPlTotal(['Spring Fling'])).toEqual({
      additive: true,
      budgetLine: 'Fundraiser #2 (Spring Fling)',
    });
    expect(mapPlTotal(['Spring Fling Expenses'])).toEqual({
      additive: true,
      budgetLine: 'Fundraiser #2 (Spring Fling)',
    });
  });
});

describe('extractPlBudgetActuals', () => {
  it('adds carnival income and expenses onto the same budget line', () => {
    const pl = [
      'Carnival Income,,,,,,,,,',
      'Total for Carnival Income,,,,,,,,,1000',
      'Carnival Expenses,,,,,,,,,',
      'Total for Carnival Expenses,,,,,,,,,200',
    ].join('\n');
    const {actuals} = extractPlBudgetActuals(pl);
    expect(actuals.get('Fundraiser #1 (Carnival)')).toBe(1200);
  });

  it('maps income and expense totals from the sample P&L', () => {
    const pl = readFileSync(
      join(root, 'budgets/Barton Hills Elementary PTA_Profit and Loss Detail.csv'),
      'utf8',
    );
    const {actuals} = extractPlBudgetActuals(pl);

    expect(actuals.get('Business contributions')).toBe(151);
    expect(actuals.get('Annual Fund — Businesses')).toBe(33252);
    expect(actuals.get('Annual Fund — Families')).toBe(188663);
    expect(actuals.get('Snacks for classrooms')).toBe(52);
    expect(actuals.get('Additional Staffing funds (Music, Art & PE)')).toBe(85000);
    expect(actuals.get('Admin - Accounting')).toBe(80);
    expect(actuals.get('Admin - PTA expenses')).toBe(138);
    expect(actuals.get('Admin - Bank & credit card fees')).toBe(8);
    expect(actuals.get('Admin - Google Drive')).toBe(48);
    expect(actuals.get('Admin - Liability insurance')).toBe(500);
    expect(actuals.get('Admin - Tax return preparation')).toBe(250);
    expect(actuals.get('Admin - Website')).toBe(0);
    expect(actuals.get('Fundraiser - Sponsorship signs')).toBe(110);
    expect(actuals.get('Fundraiser #1 (Carnival)')).toBe(3385);
    expect(actuals.get('School Improvements')).toBe(1192);
    expect(actuals.get('Community events')).toBe(114);
    expect(actuals.get('Hospitality - End of semester gifts')).toBe(247);
    expect(actuals.get('GreenWorks')).toBe(140);
    expect(actuals.get('Library')).toBe(492);
    expect(actuals.get('Teacher lounge coffee & food')).toBe(37);
    expect(actuals.get('Teacher grant program for Fall')).toBe(391);
    expect(actuals.get('Unified Champions')).toBe(200);
  });
});

describe('generateMonthBudget', () => {
  it('updates actuals, header, and totals from P&L + August template', () => {
    const template = readFileSync(join(root, 'budgets/August 2026.csv'), 'utf8');
    const pl = readFileSync(
      join(root, 'budgets/Barton Hills Elementary PTA_Profit and Loss Detail.csv'),
      'utf8',
    );
    const {actuals} = extractPlBudgetActuals(pl);
    const result = generateMonthBudget({
      asOfDate: '2026-09-12',
      bankBalanceCents: 15000000,
      plActuals: actuals,
      previousLabel: 'August 2026',
      templateCsv: template,
    });

    expect(result.unmatchedBudgetLines).toEqual([]);
    const rows = parseCsv(result.csv);
    expect(rows[0]?.[1]).toBe('current balance $150,000.00');
    expect(rows[0]?.[2]).toBe('available for expenses $122,500.00');
    expect(rows[0]?.[3]).toContain('Key changes from August 2026');

    const family = rows.find((r) => r[0]?.startsWith('Annual Fund — Families'));
    expect(family?.[2]).toBe('$188,663');

    const carnival = rows.find((r) => r[0] === 'Fundraiser #1 (Carnival)');
    expect(carnival?.[2]).toBe('$3,385');

    const section = rows.find((r) => r[0]?.startsWith('INCOME'));
    expect(section?.[2]).toContain('9/12/26');
  });
});
