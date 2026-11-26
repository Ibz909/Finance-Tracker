import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { CONTROL_CLASS, fieldA11yProps } from '../../components/ui/formControl';
import { getCategoriesByType } from '../../constants/categories';
import type { TransactionFilters, TransactionSort, TypeFilter } from './transactionFilters';
import {
  dateRangeError,
  DEFAULT_FILTERS,
  SORT_LABELS,
  TRANSACTION_SORTS,
} from './transactionFilters';

interface TransactionFiltersBarProps {
  filters: TransactionFilters;
  onChange: (changes: Partial<TransactionFilters>) => void;
}

const PANEL_ID = 'transaction-filters';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expenses' },
] as const satisfies readonly { value: TypeFilter; label: string }[];

/**
 * Search and the All / Income / Expenses quick filters are always visible;
 * category, a custom date range and sorting sit behind the Filters button.
 */
export function TransactionFiltersBar({ filters, onChange }: TransactionFiltersBarProps) {
  const rangeError = dateRangeError(filters);
  // How many of the panel's own settings differ from the defaults.
  const panelCount = [
    filters.categoryId !== null,
    filters.from !== null || filters.to !== null,
    filters.sort !== DEFAULT_FILTERS.sort,
  ].filter(Boolean).length;
  // Open by default when something inside it is already set, so it's never hidden.
  const [panelOpen, setPanelOpen] = useState(panelCount > 0);
  const groups = [
    { label: 'Expenses', type: 'expense' as const },
    { label: 'Income', type: 'income' as const },
  ].filter((group) => filters.type === 'all' || filters.type === group.type);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
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
            placeholder="Search"
            autoComplete="off"
            value={filters.query}
            onChange={(event) => {
              onChange({ query: event.target.value });
            }}
            className={`${CONTROL_CLASS} pl-9`}
          />
        </div>
        <div className="flex flex-1 flex-wrap gap-2 sm:flex-none sm:flex-nowrap">
          <div className="min-w-56 flex-1 sm:w-64 sm:flex-none">
            <SegmentedControl<TypeFilter>
              variant="field"
              hideLegend
              legend="Type"
              name="filter-type"
              value={filters.type}
              options={TYPE_OPTIONS}
              onChange={(type) => {
                onChange({ type });
              }}
            />
          </div>
          <Button
            variant="secondary"
            className="aria-expanded:bg-muted"
            aria-expanded={panelOpen}
            aria-controls={PANEL_ID}
            onClick={() => {
              setPanelOpen((open) => !open);
            }}
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Filters{panelCount > 0 ? ` (${String(panelCount)})` : ''}
          </Button>
        </div>
      </div>

      <div
        id={PANEL_ID}
        className={`${panelOpen ? 'grid' : 'hidden'} gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4`}
      >
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

        <FormField id="filter-from" label="From" hint="A custom range replaces the month">
          <input
            type="date"
            className={CONTROL_CLASS}
            value={filters.from ?? ''}
            onChange={(event) => {
              onChange({ from: event.target.value || null });
            }}
            {...fieldA11yProps('filter-from', undefined, 'A custom range replaces the month')}
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
    </div>
  );
}
