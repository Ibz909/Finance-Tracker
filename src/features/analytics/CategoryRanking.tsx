import { CategoryIcon } from '../../components/ui/CategoryIcon';
import type { MonthKey } from '../../utils/dates';
import { formatPence } from '../../utils/money';
import type { categoryBreakdown } from './analytics';
import { rangeLabel } from './analytics';

interface CategoryRankingProps {
  breakdown: ReturnType<typeof categoryBreakdown>;
  months: readonly MonthKey[];
}

/** Categories ranked by spending, with amount and share as text and a bar. */
export function CategoryRanking({ breakdown, months }: CategoryRankingProps) {
  return (
    <section
      aria-labelledby="ranking-heading"
      className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
    >
      <h2 id="ranking-heading" className="text-base font-semibold">
        Category analysis
      </h2>
      {breakdown.categories.length === 0 ? (
        <p className="mt-6 mb-2 rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
          No spending in {rangeLabel(months)}.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            Where your money went in {rangeLabel(months)}, largest first.
          </p>
          <ol className="mt-4 space-y-4">
            {breakdown.categories.map((category, index) => (
              <li key={category.categoryId} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <CategoryIcon categoryId={category.categoryId} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-medium">{category.label}</span>
                    <span className="shrink-0 text-sm tabular-nums">
                      {formatPence(category.totalPence)}
                      <span className="text-muted-foreground"> · {category.sharePercent}%</span>
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${String(category.sharePercent)}%`,
                        background: `var(--${category.color})`,
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
