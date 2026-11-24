import type { AppData } from '../models/appData';
import type { Budget } from '../models/budget';
import { budgetKey } from '../models/budget';
import { createEmptyAppData } from '../models/appData';
import type { RecurringDraft, RecurringSchedule } from '../models/recurring';
import type { GoalContribution, GoalDraft, SavingsGoal } from '../models/savings';
import type { Transaction, TransactionDraft } from '../models/transaction';
import { catchUpAll } from '../features/recurring/catchUp';
import { firstOccurrenceOnOrAfter } from '../features/recurring/schedule';
import type { IsoDate } from '../utils/dates';

/**
 * Every change to app data is one of these actions. The reducer is pure:
 * IDs and timestamps are created *before* dispatch and passed in, so the
 * same action always produces the same state (easy to test and reason about).
 */
export type AppDataAction =
  | { type: 'transactionAdded'; transaction: Transaction }
  | { type: 'transactionUpdated'; id: string; changes: TransactionDraft; updatedAt: string }
  | { type: 'transactionDeleted'; id: string }
  | { type: 'budgetAdded'; budget: Budget }
  /** Only the limit can change; what a budget is for is fixed once created. */
  | { type: 'budgetUpdated'; id: string; limitPence: number; updatedAt: string }
  | { type: 'budgetDeleted'; id: string }
  /**
   * Recurring schedules. Every action that could make a payment due also
   * catches up, so `today` (a calendar date) and `now` (for timestamps)
   * are passed in to keep the reducer pure.
   */
  | { type: 'recurringScheduleAdded'; schedule: RecurringSchedule; today: IsoDate; now: string }
  /** Changes to timing apply from today; past payments are never re-added. */
  | {
      type: 'recurringScheduleUpdated';
      id: string;
      changes: RecurringDraft;
      today: IsoDate;
      now: string;
    }
  /** Resuming skips payments missed while paused. */
  | { type: 'recurringSchedulePaused'; id: string; paused: boolean; today: IsoDate; now: string }
  /** Transactions already added stay; they are part of your history. */
  | { type: 'recurringScheduleDeleted'; id: string }
  /** Adds every payment that has fallen due. Runs when the app opens. */
  | { type: 'recurringCaughtUp'; today: IsoDate; now: string }
  | { type: 'goalAdded'; goal: SavingsGoal }
  | { type: 'goalUpdated'; id: string; changes: GoalDraft; updatedAt: string }
  /** Also removes the goal's contributions: they mean nothing without it. */
  | { type: 'goalDeleted'; id: string }
  | { type: 'contributionAdded'; contribution: GoalContribution }
  | { type: 'contributionDeleted'; id: string }
  /**
   * Replaces any existing demo records with these. Real records are never
   * touched, and a demo budget is skipped if a real budget already covers
   * the same category (or overall), so the user's own limit always wins.
   */
  | {
      type: 'demoDataLoaded';
      transactions: Transaction[];
      budgets: Budget[];
      goals?: SavingsGoal[];
      contributions?: GoalContribution[];
    }
  /** Removes every record flagged isDemo, and nothing else. */
  | { type: 'demoDataCleared' }
  | { type: 'dataReset' };

export function appDataReducer(state: AppData, action: AppDataAction): AppData {
  switch (action.type) {
    case 'transactionAdded':
      return { ...state, transactions: [...state.transactions, action.transaction] };

    case 'transactionUpdated': {
      if (!state.transactions.some((t) => t.id === action.id)) return state;
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id
            ? // Keep identity and system fields (id, createdAt, isDemo, recurring link).
              { ...applyChanges(t, action.changes), updatedAt: action.updatedAt }
            : t,
        ),
      };
    }

    case 'transactionDeleted': {
      const transactions = state.transactions.filter((t) => t.id !== action.id);
      // Same reference when nothing changed, so nothing is re-saved or re-rendered.
      return transactions.length === state.transactions.length ? state : { ...state, transactions };
    }

    case 'budgetAdded':
      return { ...state, budgets: [...state.budgets, action.budget] };

    case 'budgetUpdated': {
      if (!state.budgets.some((b) => b.id === action.id)) return state;
      return {
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === action.id
            ? { ...b, limitPence: action.limitPence, updatedAt: action.updatedAt }
            : b,
        ),
      };
    }

    case 'budgetDeleted': {
      const budgets = state.budgets.filter((b) => b.id !== action.id);
      return budgets.length === state.budgets.length ? state : { ...state, budgets };
    }

    case 'recurringScheduleAdded':
      return catchUp(
        { ...state, recurringSchedules: [...state.recurringSchedules, action.schedule] },
        action,
      );

    case 'recurringScheduleUpdated': {
      const current = state.recurringSchedules.find((s) => s.id === action.id);
      if (!current) return state;
      const updated = applyScheduleChanges(current, action.changes, action.today, action.now);
      return catchUp(replaceSchedule(state, updated), action);
    }

    case 'recurringSchedulePaused': {
      const current = state.recurringSchedules.find((s) => s.id === action.id);
      if (!current || current.paused === action.paused) return state;
      const updated: RecurringSchedule = {
        ...current,
        paused: action.paused,
        updatedAt: action.now,
        // On resume, carry on from today rather than adding missed payments.
        nextDueDate: action.paused
          ? current.nextDueDate
          : firstOccurrenceOnOrAfter(
              current.startDate,
              current.frequency,
              action.today,
              current.endDate,
            ),
      };
      return catchUp(replaceSchedule(state, updated), action);
    }

    case 'recurringScheduleDeleted': {
      const recurringSchedules = state.recurringSchedules.filter((s) => s.id !== action.id);
      return recurringSchedules.length === state.recurringSchedules.length
        ? state
        : { ...state, recurringSchedules };
    }

    case 'recurringCaughtUp':
      return catchUp(state, action);

    case 'goalAdded':
      return { ...state, savingsGoals: [...state.savingsGoals, action.goal] };

    case 'goalUpdated': {
      if (!state.savingsGoals.some((g) => g.id === action.id)) return state;
      return {
        ...state,
        savingsGoals: state.savingsGoals.map((g) => {
          if (g.id !== action.id) return g;
          const next: SavingsGoal = { ...g, ...action.changes, updatedAt: action.updatedAt };
          // Clearing the date in the form must remove it, not keep the old one.
          if (action.changes.targetDate === undefined) delete next.targetDate;
          return next;
        }),
      };
    }

    case 'goalDeleted': {
      const savingsGoals = state.savingsGoals.filter((g) => g.id !== action.id);
      if (savingsGoals.length === state.savingsGoals.length) return state;
      return {
        ...state,
        savingsGoals,
        goalContributions: state.goalContributions.filter((c) => c.goalId !== action.id),
      };
    }

    case 'contributionAdded':
      // Never attach money to a goal that doesn't exist.
      if (!state.savingsGoals.some((g) => g.id === action.contribution.goalId)) return state;
      return { ...state, goalContributions: [...state.goalContributions, action.contribution] };

    case 'contributionDeleted': {
      const goalContributions = state.goalContributions.filter((c) => c.id !== action.id);
      return goalContributions.length === state.goalContributions.length
        ? state
        : { ...state, goalContributions };
    }

    case 'demoDataLoaded': {
      const realBudgets = state.budgets.filter((b) => !b.isDemo);
      const taken = new Set(realBudgets.map(budgetKey));
      return {
        ...state,
        transactions: [...state.transactions.filter((t) => !t.isDemo), ...action.transactions],
        budgets: [...realBudgets, ...action.budgets.filter((b) => !taken.has(budgetKey(b)))],
        savingsGoals: [...state.savingsGoals.filter((g) => !g.isDemo), ...(action.goals ?? [])],
        goalContributions: [
          ...state.goalContributions.filter((c) => !c.isDemo),
          ...(action.contributions ?? []),
        ],
      };
    }

    case 'demoDataCleared': {
      const transactions = state.transactions.filter((t) => !t.isDemo);
      const budgets = state.budgets.filter((b) => !b.isDemo);
      const recurringSchedules = state.recurringSchedules.filter((s) => !s.isDemo);
      const savingsGoals = state.savingsGoals.filter((g) => !g.isDemo);
      const goalContributions = state.goalContributions.filter((c) => !c.isDemo);
      const unchanged =
        transactions.length === state.transactions.length &&
        budgets.length === state.budgets.length &&
        recurringSchedules.length === state.recurringSchedules.length &&
        savingsGoals.length === state.savingsGoals.length &&
        goalContributions.length === state.goalContributions.length;
      return unchanged
        ? state
        : {
            ...state,
            transactions,
            budgets,
            recurringSchedules,
            savingsGoals,
            goalContributions,
          };
    }

    case 'dataReset':
      return createEmptyAppData();
  }
}

/** Clearing notes in the form must remove them, not leave the old value. */
function applyChanges(current: Transaction, changes: TransactionDraft): Transaction {
  const next: Transaction = { ...current, ...changes };
  if (changes.notes === undefined || changes.notes === '') delete next.notes;
  return next;
}

/** Adds due payments for every schedule; the same state if none were due. */
function catchUp(state: AppData, { today, now }: { today: IsoDate; now: string }): AppData {
  const result = catchUpAll(state.recurringSchedules, state.transactions, { today, now });
  if (result.schedules === state.recurringSchedules) return state;
  return {
    ...state,
    recurringSchedules: [...result.schedules],
    transactions: [...result.transactions],
  };
}

function replaceSchedule(state: AppData, updated: RecurringSchedule): AppData {
  return {
    ...state,
    recurringSchedules: state.recurringSchedules.map((s) => (s.id === updated.id ? updated : s)),
  };
}

/**
 * Applies form changes. If the timing changed (start, frequency or end),
 * the next payment is recalculated from today, so nothing in the past is
 * added again. Otherwise the schedule carries on exactly where it was.
 */
function applyScheduleChanges(
  current: RecurringSchedule,
  changes: RecurringDraft,
  today: IsoDate,
  now: string,
): RecurringSchedule {
  const next: RecurringSchedule = { ...current, ...changes, updatedAt: now };
  if (!changes.notes) delete next.notes;
  if (changes.endDate === undefined) delete next.endDate;

  const timingChanged =
    current.startDate !== next.startDate ||
    current.frequency !== next.frequency ||
    current.endDate !== next.endDate;
  if (timingChanged) {
    next.nextDueDate = firstOccurrenceOnOrAfter(
      next.startDate,
      next.frequency,
      today,
      next.endDate,
    );
  }
  return next;
}
