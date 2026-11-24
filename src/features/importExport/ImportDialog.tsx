import { CircleAlert, CircleCheck, CopyMinus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import type { ImportPlan } from './importPlan';

export type ImportDialogState =
  | { status: 'closed' }
  | { status: 'error'; fileName: string; error: string }
  | { status: 'preview'; fileName: string; plan: ImportPlan };

const plural = (n: number, word: string) =>
  `${n.toLocaleString('en-GB')} ${word}${n === 1 ? '' : 's'}`;

/** Summarises row numbers compactly: "2, 4 and 9" or "2, 4, 9 and 12 more". */
function rowList(rows: readonly number[], shown = 10): string {
  const head = rows.slice(0, shown).map(String);
  const rest = rows.length - head.length;
  if (rest > 0) return `${head.join(', ')} and ${String(rest)} more`;
  return head.length > 1
    ? `${head.slice(0, -1).join(', ')} and ${head.at(-1) ?? ''}`
    : (head[0] ?? '');
}

/**
 * Shows what an import would do before anything is saved: how many rows
 * are ready, which were skipped as duplicates, and every problem by row.
 */
export function ImportDialog({
  state,
  onCancel,
  onConfirm,
}: {
  state: ImportDialogState;
  onCancel: () => void;
  onConfirm: (plan: ImportPlan) => void;
}) {
  if (state.status === 'error' || state.status === 'closed') {
    return (
      <Dialog
        open={state.status === 'error'}
        onClose={onCancel}
        title="This file can’t be imported"
        description={state.status === 'error' ? state.fileName : undefined}
      >
        <p className="text-sm">{state.status === 'error' ? state.error : ''}</p>
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onCancel} data-autofocus>
            Close
          </Button>
        </div>
      </Dialog>
    );
  }

  const { plan, fileName } = state;
  const ready = plan.ready.length;

  return (
    <Dialog open onClose={onCancel} title="Import transactions" description={fileName}>
      <ul className="space-y-3 text-sm">
        <li className="flex items-start gap-2">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-positive" />
          <span>
            <span className="font-medium">{plural(ready, 'transaction')}</span> ready to import.
          </span>
        </li>
        {plan.duplicateRows.length > 0 && (
          <li className="flex items-start gap-2">
            <CopyMinus
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <span>
              <span className="font-medium">{plural(plan.duplicateRows.length, 'duplicate')}</span>{' '}
              will be skipped because you already have{' '}
              {plan.duplicateRows.length === 1 ? 'it' : 'them'} (
              {plan.duplicateRows.length === 1 ? 'row' : 'rows'} {rowList(plan.duplicateRows)}).
            </span>
          </li>
        )}
        {plan.problems.length > 0 && (
          <li className="flex items-start gap-2">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-negative" />
            <span>
              <span className="font-medium">{plural(plan.problems.length, 'row')}</span>{' '}
              {plan.problems.length === 1 ? 'has a problem and' : 'have problems and'} will be
              skipped. Fix {plan.problems.length === 1 ? 'it' : 'them'} in the file and import it
              again to add {plan.problems.length === 1 ? 'it' : 'them'}.
            </span>
          </li>
        )}
      </ul>

      {plan.problems.length > 0 && (
        <div
          role="region"
          aria-label="Problems found"
          tabIndex={0}
          className="mt-4 max-h-60 overflow-y-auto rounded-lg border border-border"
        >
          <ul className="divide-y divide-border text-sm">
            {plan.problems.map(({ row, errors }) => (
              <li key={row} className="px-3 py-2">
                <p className="font-medium">Row {row}</p>
                <ul className="mt-0.5 list-disc pl-5 text-muted-foreground">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          {ready === 0 ? 'Close' : 'Cancel'}
        </Button>
        {ready > 0 && (
          <Button
            data-autofocus
            onClick={() => {
              onConfirm(plan);
            }}
          >
            Import {plural(ready, 'transaction')}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
