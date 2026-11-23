import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { CONTROL_CLASS, fieldA11yProps } from '../../components/ui/formControl';
import { getCategoriesByType } from '../../constants/categories';
import type { TransactionFilters, TransactionSort, TypeFilter } from './transactionFilters';
import { dateRangeError, SORT_LABELS, TRANSACTION_SORTS } from './transactionFilters';

interface TransactionFiltersBarProps {
  filters: TransactionFilters;
  activeCount: number;
  onChange: (changes: Partial<TransactionFilters>) => void;
  onReset: () => void;
}

const PANEL_ID = 'transaction-filters';

export function TransactionFiltersBar({
  filters,
  activeCount,
  onChange,
  onReset,
}: TransactionFiltersBarProps) {
  // Phones: filters fold away behind a button. Desktop: always shown.
  const [panelOpen, setPanelOpen] = useState(false);
  const rangeError = dateRangeError(filters);
  const groups = [
    { label: 'Expenses', type: 'expense' as const },
    { label: 'Income', type: 'income' as const },
  ].filter((group) => filters.type === 'all' || filters.type === group.type);

  return (
    <div className="space-y-3 border-b border-border px-4 py-4 sm:px-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="transaction-search" className="sr-only">
            Search transactions
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="transaction-search"
            type="search"
            placeholder="Search descriptions"
            autoComplete="off"
            value={filters.query}
            onChange={(event) => {
              onChange({ query: event.target.value });
            }}
            className={`${CONTROL_CLASS} pl-9`}
          />
        </div>
        <Button
          variant="secondary"
          className="lg:hidden"
          aria-expanded={panelOpen}
          aria-controls={PANEL_ID}
          onClick={() => {
            setPanelOpen((open) => !open);
          }}
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Filters{activeCount > 0 ? ` (${String(activeCount)})` : ''}
        </Button>
      </div>

      <div
        id={PANEL_ID}
        className={`${panelOpen ? 'grid' : 'hidden'} gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-5`}
      >
        <FormField id="filter-type" label="Type">
          <select
            id="filter-type"
            className={CONTROL_CLASS}
            value={filters.type}
            onChange={(event) => {
              onChange({ type: event.target.value as TypeFilter });
            }}
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
        </FormField>

        <FormField id="filter-category" label="Category">
          <select
            id="filter-category"
            className={CONTROL_CLASS}
            value={filters.categoryId ?? ''}
            onChange={(event) => {
              onChange({ categoryId: event.target.value || null });
            }}
          >
            <option value="">All categories</option>
            {groups.map((group) => (
              <optgroup key={group.type} label={group.label}>
                {getCategoriesByType(group.type).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </FormField>

        <FormField id="filter-from" label="From">
          <input
            type="date"
            className={CONTROL_CLASS}
            value={filters.from ?? ''}
            onChange={(event) => {
              onChange({ from: event.target.value || null });
            }}
            {...fieldA11yProps('filter-from')}
          />
        </FormField>

        <FormField id="filter-to" label="To" error={rangeError ?? undefined}>
          <input
            type="date"
            className={CONTROL_CLASS}
            value={filters.to ?? ''}
            onChange={(event) => {
              onChange({ to: event.target.value || null });
            }}
            {...fieldA11yProps('filter-to', rangeError ?? undefined)}
          />
        </FormField>

        <FormField id="filter-sort" label="Sort by">
          <select
            id="filter-sort"
            className={CONTROL_CLASS}
            value={filters.sort}
            onChange={(event) => {
              onChange({ sort: event.target.value as TransactionSort });
            }}
          >
            {TRANSACTION_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {activeCount > 0 && (
        <Button variant="ghost" className="-ml-2 h-9 px-2 sm:h-9" onClick={onReset}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Reset filters
        </Button>
      )}
    </div>
  );
}
