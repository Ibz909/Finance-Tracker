import type { DefaultCategoryId } from '../../constants/categories';
import type { Budget } from '../../models/budget';
import type { TransactionType } from '../../models/primitives';
import type { Transaction } from '../../models/transaction';
import type { IsoDate, MonthKey } from '../../utils/dates';
import { currentMonthKey, shiftMonth, todayIsoDate } from '../../utils/dates';

/** How many calendar months of history the demo covers, including this one. */
export const DEMO_MONTHS = 6;
export const DEMO_ID_PREFIX = 'demo-';

interface DemoItem {
  /** Unique within a month; becomes part of the stable ID. */
  key: string;
  type: TransactionType;
  categoryId: DefaultCategoryId;
  description: string;
  day: number;
  /** Amounts in pence, picked by calendar month so each month always looks the same. */
  amounts: readonly number[];
  /** Which calendar months (by month number % length) include this item. Default: all. */
  inMonth?: (monthNumber: number) => boolean;
}

const everyOther = (n: number) => n % 2 === 0;
const onlyWhen = (remainder: number) => (n: number) => n % 6 === remainder;

/**
 * Fictional, realistic UK monthly finances. Every amount is in pence.
 * Salary is paid on the 1st so the current month never starts with
 * spending but no income, which would make a first look misleading.
 */
const ITEMS: readonly DemoItem[] = [
  // Income
  {
    key: 'salary',
    type: 'income',
    categoryId: 'salary',
    description: 'Monthly salary',
    day: 1,
    amounts: [265000],
  },
  {
    key: 'freelance',
    type: 'income',
    categoryId: 'freelance',
    description: 'Freelance design project',
    day: 14,
    amounts: [45000, 32000, 60000],
    inMonth: everyOther,
  },
  {
    key: 'gift',
    type: 'income',
    categoryId: 'gifts',
    description: 'Birthday money from family',
    day: 9,
    amounts: [5000],
    inMonth: onlyWhen(3),
  },
  {
    key: 'refund',
    type: 'income',
    categoryId: 'refunds',
    description: 'Refund for returned jacket',
    day: 19,
    amounts: [4999],
    inMonth: onlyWhen(1),
  },
  // Housing and bills
  {
    key: 'rent',
    type: 'expense',
    categoryId: 'rent_housing',
    description: 'Rent',
    day: 1,
    amounts: [95000],
  },
  {
    key: 'council-tax',
    type: 'expense',
    categoryId: 'bills_utilities',
    description: 'Council tax',
    day: 3,
    amounts: [14800],
  },
  {
    key: 'energy',
    type: 'expense',
    categoryId: 'bills_utilities',
    description: 'Gas and electricity',
    day: 6,
    amounts: [8900, 9400, 11200, 12800, 13500, 12100],
  },
  {
    key: 'phone',
    type: 'expense',
    categoryId: 'bills_utilities',
    description: 'Mobile phone contract',
    day: 12,
    amounts: [1800],
  },
  // Subscriptions and health
  {
    key: 'music',
    type: 'expense',
    categoryId: 'subscriptions',
    description: 'Music streaming',
    day: 5,
    amounts: [1199],
  },
  {
    key: 'video',
    type: 'expense',
    categoryId: 'subscriptions',
    description: 'Video streaming',
    day: 18,
    amounts: [1099],
  },
  {
    key: 'gym',
    type: 'expense',
    categoryId: 'health_fitness',
    description: 'Gym membership',
    day: 2,
    amounts: [3500],
  },
  // Everyday spending
  {
    key: 'groceries-1',
    type: 'expense',
    categoryId: 'food_groceries',
    description: 'Weekly grocery shop',
    day: 4,
    amounts: [6240, 7115, 5890, 8320, 6675, 7450],
  },
  {
    key: 'groceries-2',
    type: 'expense',
    categoryId: 'food_groceries',
    description: 'Weekly grocery shop',
    day: 11,
    amounts: [7115, 5890, 8320, 6675, 7450, 6240],
  },
  {
    key: 'groceries-3',
    type: 'expense',
    categoryId: 'food_groceries',
    description: 'Weekly grocery shop',
    day: 18,
    amounts: [5890, 8320, 6675, 7450, 6240, 7115],
  },
  {
    key: 'groceries-4',
    type: 'expense',
    categoryId: 'food_groceries',
    description: 'Weekly grocery shop',
    day: 25,
    amounts: [8320, 6675, 7450, 6240, 7115, 5890],
  },
  {
    key: 'train',
    type: 'expense',
    categoryId: 'transport',
    description: 'Train tickets',
    day: 9,
    amounts: [4250, 3800, 5100, 4675],
  },
  {
    key: 'bus',
    type: 'expense',
    categoryId: 'transport',
    description: 'Bus fares',
    day: 21,
    amounts: [1650, 1800, 1500],
  },
  {
    key: 'dinner',
    type: 'expense',
    categoryId: 'restaurants_takeaways',
    description: 'Dinner with friends',
    day: 16,
    amounts: [4280, 5620, 3890],
  },
  {
    key: 'takeaway',
    type: 'expense',
    categoryId: 'restaurants_takeaways',
    description: 'Friday takeaway',
    day: 27,
    amounts: [2350, 1980, 2740, 2195],
  },
  {
    key: 'cinema',
    type: 'expense',
    categoryId: 'entertainment',
    description: 'Cinema tickets',
    day: 20,
    amounts: [2400, 2800],
    inMonth: everyOther,
  },
  {
    key: 'concert',
    type: 'expense',
    categoryId: 'entertainment',
    description: 'Concert tickets',
    day: 8,
    amounts: [6500],
    inMonth: onlyWhen(5),
  },
  // Occasional purchases
  {
    key: 'shopping',
    type: 'expense',
    categoryId: 'shopping',
    description: 'Clothes shopping',
    day: 13,
    amounts: [8900, 4500, 12900, 3600],
  },
  {
    key: 'holiday',
    type: 'expense',
    categoryId: 'travel',
    description: 'Weekend in Edinburgh',
    day: 22,
    amounts: [38500],
    inMonth: onlyWhen(2),
  },
  {
    key: 'course',
    type: 'expense',
    categoryId: 'education',
    description: 'Online coding course',
    day: 15,
    amounts: [4900],
    inMonth: onlyWhen(4),
  },
  {
    key: 'misc',
    type: 'expense',
    categoryId: 'other_expense',
    description: 'Haircut',
    day: 24,
    amounts: [2200],
    inMonth: everyOther,
  },
];

/** Absolute month number, so amounts depend on the calendar month, not on when data was generated. */
function monthNumber(month: MonthKey): number {
  const [year = 0, monthIndex = 1] = month.split('-').map(Number);
  return year * 12 + (monthIndex - 1);
}

/**
 * Builds the demo dataset ending at `now`. Deterministic: the same `now`
 * always gives the same transactions. Nothing is dated after today.
 * Every record has `isDemo: true` and an ID starting with "demo-".
 */
export function generateDemoTransactions(now: Date = new Date()): Transaction[] {
  const today: IsoDate = todayIsoDate(now);
  const thisMonth = currentMonthKey(now);
  const transactions: Transaction[] = [];

  for (let offset = DEMO_MONTHS - 1; offset >= 0; offset--) {
    const month = shiftMonth(thisMonth, -offset);
    const n = monthNumber(month);

    for (const item of ITEMS) {
      if (item.inMonth && !item.inMonth(n)) continue;
      const date = `${month}-${String(item.day).padStart(2, '0')}`;
      if (date > today) continue;

      const timestamp = `${date}T12:00:00.000Z`;
      transactions.push({
        id: `${DEMO_ID_PREFIX}${month}-${item.key}`,
        type: item.type,
        categoryId: item.categoryId,
        description: item.description,
        amountPence: item.amounts[n % item.amounts.length] ?? 0,
        date,
        createdAt: timestamp,
        updatedAt: timestamp,
        isDemo: true,
      });
    }
  }
  return transactions;
}

/**
 * Fictional monthly limits chosen to show a realistic mix of statuses
 * against the demo spending: groceries usually near the limit, eating out
 * usually over, transport and entertainment usually on track.
 */
const DEMO_BUDGETS: readonly { key: string; categoryId?: DefaultCategoryId; limitPence: number }[] =
  [
    { key: 'overall', limitPence: 200000 },
    { key: 'groceries', categoryId: 'food_groceries', limitPence: 30000 },
    { key: 'eating-out', categoryId: 'restaurants_takeaways', limitPence: 6000 },
    { key: 'transport', categoryId: 'transport', limitPence: 8000 },
    { key: 'entertainment', categoryId: 'entertainment', limitPence: 6000 },
  ];

/** Demo budgets, flagged isDemo with IDs like "demo-budget-groceries". */
export function generateDemoBudgets(now: Date = new Date()): Budget[] {
  const timestamp = `${todayIsoDate(now)}T12:00:00.000Z`;
  return DEMO_BUDGETS.map(({ key, categoryId, limitPence }) => ({
    id: `${DEMO_ID_PREFIX}budget-${key}`,
    scope: categoryId ? 'category' : 'overall',
    ...(categoryId ? { categoryId } : {}),
    limitPence,
    createdAt: timestamp,
    updatedAt: timestamp,
    isDemo: true,
  }));
}
