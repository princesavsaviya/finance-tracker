export const DEFAULT_EXPENSE_CATEGORIES = [
  'Rent', 'Groceries', 'Transport', 'Eating Out', 'Subscriptions',
  'Phone', 'Utilities', 'Health', 'Education', 'Travel', 'Gifts/Family', 'Misc'
];

export const DEFAULT_INCOME_SOURCES = [
  'Barista (UCR)', 'SWE Job', 'Freelance', 'Gift', 'Other'
];

export const DEFAULT_SETTINGS = {
  donationRate: 0.25,
  cards: [],
  people: [],
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  incomeSources: DEFAULT_INCOME_SOURCES,
  budgets: {},
  recurring: [],
};

export const FILE_PATHS = {
  settings: 'data/settings.json',
  income: 'data/income.json',
  expenses: 'data/expenses.json',
  donations: 'data/donations.json',
};

export const DEFAULTS = {
  settings: DEFAULT_SETTINGS,
  income: { entries: [] },
  expenses: { entries: [] },
  donations: { entries: [] },
};

export function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr() {
  return fmtDate(new Date());
}

export function fmtMoney(n, withSign = false) {
  const sign = withSign && n > 0 ? '+' : '';
  return `${sign}${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`;
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function startOfYear(d = new Date()) {
  return new Date(d.getFullYear(), 0, 1);
}

export function isInMonth(dateStr, ref = new Date()) {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function isInYear(dateStr, ref = new Date()) {
  return new Date(dateStr).getFullYear() === ref.getFullYear();
}

export function monthLabel(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function splitTotal(expense) {
  return (expense.splits || []).reduce((s, sp) => s + sp.amount, 0);
}

export function netAmount(expense) {
  return expense.amount - splitTotal(expense);
}

export function paymentMethodLabel(pm, cards) {
  if (!pm || pm === 'cash') return 'Cash';
  if (pm.startsWith('card-')) {
    const id = pm.slice(5);
    const card = cards.find((c) => c.id === id);
    return card ? `${card.name}${card.last4 ? ` ****${card.last4}` : ''}` : 'Unknown card';
  }
  return pm;
}

export function uid() {
  return Date.now() + Math.floor(Math.random() * 1000);
}
