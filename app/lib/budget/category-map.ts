/**
 * P&L leaf category → budget line name (exact or prefix match on budget Category col).
 * Path-aware income keys use `parent > leaf` when the leaf name is ambiguous.
 */

export type PlMappedAmount = {
  budgetLine: string;
  /** When true, add to any existing mapped amount for the same budget line (e.g. Merchandise → Store). */
  additive?: boolean;
};

/** Exact leaf name → mapping (used when path-specific rules don't apply). */
export const EXPENSE_LEAF_MAP: Record<string, string> = {
  'ACPTA Mini Equity Grants': 'ACPTA Mini-Grants & Austin Ed Grants',
  'Taxes - sales': 'Sales tax',
  'Teacher Appreciation/Retirement': 'Teacher retirement/commemoration',
  'Unified Champions': 'Unified Champions',
  'Academic Enrichment': 'Academic Enrichment',
  'Class Gardens': 'Class gardens',
  'Community Events': 'Community events',
  Courtesy: 'Courtesy - Teacher/staff appreciation for life events',
  'Cultural Arts': 'Cultural arts',
  'End of Semester Gifts': 'Hospitality - End of semester gifts',
  'GreenWorks (formerly Landscapin': 'GreenWorks',
  GreenWorks: 'GreenWorks',
  Hospitality: 'Hospitality - Monthly teacher appreciation event',
  Library: 'Library',
  'P.E. Fund': 'P.E. Fund/Ninja',
  "Teacher's Lounge Food & Drinks": 'Teacher lounge coffee & food',
  'Nick Akery': 'Nick Akery scholarship',
  Accounting: 'Admin - Accounting',
  'ACPTA Dues': 'Admin - ACPTA dues',
  'Google Drive': 'Admin - Google Drive',
  'Liability Insurance': 'Admin - Liability insurance',
  'Membership Management': 'Admin - Membership management',
  'Texas PTA Dues': 'Admin - Membership dues to TXPTA',
  Website: 'Admin - Website',
  'Carnival Expenses': 'Fundraiser #1 (Carnival)',
  'Online Store': 'Online Store — cost of goods',
  'Spring Fling Expenses': 'Fundraiser #2 (Spring Fling)',
  'Sponsor Signs': 'Fundraiser - Sponsorship signs',
  Counselor: "Counselor's fund",
  Snacks: 'Snacks for classrooms',
  'Special Area Teachers': 'Classroom - Special Areas teacher reimbursement',
  'Teacher Reimbursement': 'Classroom - Teacher reimbursement',
  'School T-Shirts + Field Day T-Shirts': 'Student & teacher merch',
  'Yearbook Printing': 'Yearbook',
  'Teacher Grants Fall': 'Teacher grant program for Fall',
  'Teacher Grants Spring': 'Teacher grant program for Spring',
  'School Improvements': 'School Improvements',
  'Bank Service Charges': 'Admin - Bank & credit card fees',
  'Tax Preparation': 'Admin - Tax return preparation',
  Administrative: 'Admin - PTA expenses',
  'Additional Staffing funds (Music, Art & PE)': 'Additional Staffing funds (Music, Art & PE)',
};

/** Path suffix patterns for income (checked most-specific first). */
export const INCOME_PATH_RULES: Array<{
  match: (path: string[]) => boolean;
  budgetLine: string;
  additive?: boolean;
}> = [
  {
    match: (path) =>
      pathIncludes(path, 'Annual Fund') && leafEquals(path, 'Business Contributions'),
    budgetLine: 'Annual Fund — Businesses',
  },
  {
    match: (path) => pathIncludes(path, 'Annual Fund') && leafEquals(path, 'Family Contributions'),
    budgetLine: 'Annual Fund — Families',
  },
  {
    match: (path) =>
      !pathIncludes(path, 'Annual Fund') && leafEquals(path, 'Business Contributions'),
    budgetLine: 'Business contributions',
  },
  {
    match: (path) => leafEquals(path, 'Fun Raising - Group Dining'),
    budgetLine: 'Fun Raising (Dine-in donations)',
  },
  {
    match: (path) => leafEquals(path, 'Sales - Merchandise'),
    additive: true,
    budgetLine: 'Store (Online and on campus)',
  },
  {
    match: (path) => leafEquals(path, 'Store (Online and on campus)'),
    budgetLine: 'Store (Online and on campus)',
  },
  {
    match: (path) => leafEquals(path, 'Carnival Income') || leafStartsWith(path, 'Carnival Income'),
    additive: true,
    budgetLine: 'Fundraiser #1 (Carnival)',
  },
  {
    match: (path) => leafEquals(path, 'Parties with a Purpose'),
    budgetLine: 'Community Fundraisers/Parties with a Purpose',
  },
  {
    match: (path) => leafEquals(path, 'Spring Fling') && !pathIncludes(path, 'Expenses'),
    additive: true,
    budgetLine: 'Fundraiser #2 (Spring Fling)',
  },
];

/** Ignore these P&L totals entirely. */
export function shouldIgnorePlTotal(path: string[], leaf: string): boolean {
  const joined = path.join(' > ').toLowerCase();
  if (leaf.toLowerCase().includes('greenworks') && joined.includes('grants')) return true;
  if (joined.includes('cost of goods sold')) return true;
  // Roll-up totals — prefer leaf totals
  if (/with sub-accounts$/i.test(leaf)) return true;
  if (
    /^(Income|Expenses|Net Income|Gross Profit|Net Ordinary Income|Net Other Income)$/i.test(leaf)
  ) {
    return true;
  }
  if (
    /^(Contributions|Fundraising Income|Fundraising Expenses|Administration|PTA Programs|Academic Classroom Expenses|Miscellaneous Expense|General School Use|Teacher Grant Program|Annual Fund|Ordinary Income\/Expenses)$/i.test(
      leaf,
    )
  ) {
    // Only ignore if this is a roll-up (path leaf equals section) — still allow if mapped as leaf
    if (!EXPENSE_LEAF_MAP[leaf] && !INCOME_PATH_RULES.some((r) => r.match(path))) {
      return true;
    }
  }
  return false;
}

export function mapPlTotal(path: string[]): PlMappedAmount | null {
  if (path.length === 0) return null;
  const leaf = path[path.length - 1];
  if (leaf == null) return null;
  if (shouldIgnorePlTotal(path, leaf)) return null;

  for (const rule of INCOME_PATH_RULES) {
    if (rule.match(path)) {
      return {additive: rule.additive, budgetLine: rule.budgetLine};
    }
  }

  // GreenWorks truncated name
  if (leaf.startsWith('GreenWorks')) {
    return {budgetLine: 'GreenWorks'};
  }
  const expense = EXPENSE_LEAF_MAP[leaf];
  if (expense) {
    const additive = leaf === 'Carnival Expenses' || leaf === 'Spring Fling Expenses';
    return {additive: additive || undefined, budgetLine: expense};
  }

  return null;
}

function pathIncludes(path: string[], name: string): boolean {
  return path.some((p) => p === name || p.startsWith(name));
}

function leafEquals(path: string[], name: string): boolean {
  const leaf = path[path.length - 1];
  return leaf === name;
}

function leafStartsWith(path: string[], prefix: string): boolean {
  const leaf = path[path.length - 1];
  return typeof leaf === 'string' && leaf.startsWith(prefix);
}

/** Find budget row category that matches a mapped budget line name. */
export function findBudgetCategory(categories: string[], budgetLine: string): string | null {
  const exact = categories.find((c) => c === budgetLine);
  if (exact) return exact;
  // Prefix: budget category starts with mapped name (income carnival line)
  const prefix = categories.find(
    (c) => c.startsWith(budgetLine) || budgetLine.startsWith(c.replace(/\s*—.*$/, '').trim()),
  );
  if (prefix) return prefix;
  // Soft: mapped line is substring of category or vice versa
  const soft = categories.find(
    (c) => c.includes(budgetLine) || budgetLine.includes(c.split(' - ')[0] ?? c),
  );
  return soft ?? null;
}
