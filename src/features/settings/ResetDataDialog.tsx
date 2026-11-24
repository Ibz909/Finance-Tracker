import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { CONTROL_CLASS, fieldA11yProps } from '../../components/ui/formControl';
import { useAppData } from '../../hooks/useAppData';

/** The word to type, so a stray click or Enter press can't wipe everything. */
export const RESET_CONFIRMATION_WORD = 'delete';

const count = (n: number, noun: string) =>
  `${n.toLocaleString('en-GB')} ${noun}${n === 1 ? '' : 's'}`;

/** "a", "a and b", "a, b and c" */
function listWords(words: readonly string[]): string {
  return words.length > 1
    ? `${words.slice(0, -1).join(', ')} and ${words.at(-1) ?? ''}`
    : (words[0] ?? '');
}

export function ResetDataDialog({
  open,
  onCancel,
  onConfirm,
  onExport,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onExport: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title="Delete all data?"
      description="This can’t be undone."
    >
      {open && <ResetForm onCancel={onCancel} onConfirm={onConfirm} onExport={onExport} />}
    </Dialog>
  );
}

function ResetForm({
  onCancel,
  onConfirm,
  onExport,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  onExport: () => void;
}) {
  const { transactions, budgets, recurringSchedules, savingsGoals } = useAppData();
  const [typed, setTyped] = useState('');
  const confirmed = typed.trim().toLowerCase() === RESET_CONFIRMATION_WORD;

  const parts = [
    { n: transactions.length, noun: 'transaction' },
    { n: budgets.length, noun: 'budget' },
    { n: recurringSchedules.length, noun: 'recurring transaction' },
    { n: savingsGoals.length, noun: 'savings goal' },
  ]
    .filter(({ n }) => n > 0)
    .map(({ n, noun }) => count(n, noun));

  const hint = `Type “${RESET_CONFIRMATION_WORD}” to confirm.`;

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (confirmed) onConfirm();
      }}
    >
      <div className="space-y-2 text-sm">
        <p>
          This permanently deletes{' '}
          <span className="font-medium">{parts.length > 0 ? listWords(parts) : 'everything'}</span>
          {savingsGoals.length > 0 ? ', including savings history' : ''}, and any backup copies kept
          from damaged data. Your theme choice is kept.
        </p>
        {transactions.length > 0 && (
          <p className="text-muted-foreground">
            Want a copy first? Export your transactions as a CSV file you can import again later.
          </p>
        )}
      </div>

      {transactions.length > 0 && (
        <Button variant="secondary" onClick={onExport}>
          <Download aria-hidden="true" className="size-4" />
          Export transactions first
        </Button>
      )}

      <FormField id="reset-confirmation" label="Confirm" hint={hint}>
        <input
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          data-autofocus
          value={typed}
          onChange={(event) => {
            setTyped(event.target.value);
          }}
          className={CONTROL_CLASS}
          {...fieldA11yProps('reset-confirmation', undefined, hint)}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" disabled={!confirmed}>
          Delete all data
        </Button>
      </div>
    </form>
  );
}
