import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { CONTROL_CLASS, fieldA11yProps } from '../../components/ui/formControl';
import { useAppData, useClock } from '../../hooks/useAppData';
import { useSavingsActions } from '../../hooks/useSavingsActions';
import { useToast } from '../../hooks/useToast';
import type { ContributionDraft, ContributionKind, SavingsGoal } from '../../models/savings';
import { CONTRIBUTION_NOTE_MAX_LENGTH } from '../../models/savings';
import { todayIsoDate } from '../../utils/dates';
import { formatPence } from '../../utils/money';
import { savedPence } from './goalProgress';
import type { ContributionFormValues } from './savingsFormSchemas';
import { contributionFormSchema } from './savingsFormSchemas';

export type ContributionDialogState = { goal: SavingsGoal; kind: ContributionKind } | null;

export function ContributionDialog({
  state,
  onClose,
}: {
  state: ContributionDialogState;
  onClose: () => void;
}) {
  const { goalContributions } = useAppData();
  const isDeposit = state?.kind !== 'withdrawal';
  const balance = state ? savedPence(goalContributions, state.goal.id) : 0;

  return (
    <Dialog
      open={state !== null}
      onClose={onClose}
      title={
        state
          ? isDeposit
            ? `Add money to ${state.goal.name}`
            : `Withdraw from ${state.goal.name}`
          : 'Add money'
      }
      description={
        isDeposit
          ? 'Record money you’ve set aside. It isn’t counted as spending.'
          : `Available to withdraw: ${formatPence(balance)}.`
      }
    >
      {state && (
        <ContributionForm
          key={`${state.goal.id}-${state.kind}`}
          goal={state.goal}
          kind={state.kind}
          onDone={onClose}
        />
      )}
    </Dialog>
  );
}

function ContributionForm({
  goal,
  kind,
  onDone,
}: {
  goal: SavingsGoal;
  kind: ContributionKind;
  onDone: () => void;
}) {
  const { addContribution } = useSavingsActions();
  const { showToast } = useToast();
  const today = todayIsoDate(useClock()());
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContributionFormValues, unknown, ContributionDraft>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: { kind, amount: '', date: today, note: '' },
  });

  function onSubmit(draft: ContributionDraft) {
    const result = addContribution(goal, draft);
    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        const name = (field === 'amountPence' ? 'amount' : field) as keyof ContributionFormValues;
        setError(name, { message: messages?.[0] ?? 'Check this field' });
      }
      return;
    }
    showToast(kind === 'deposit' ? 'Money added' : 'Withdrawal recorded');
    onDone();
  }

  return (
    <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
      <FormField id="contribution-amount" label="Amount" error={errors.amount?.message}>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground"
          >
            £
          </span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            data-autofocus
            className={`${CONTROL_CLASS} pl-7 tabular-nums`}
            {...fieldA11yProps('contribution-amount', errors.amount?.message)}
            {...register('amount')}
          />
        </div>
      </FormField>

      <FormField id="contribution-date" label="Date" error={errors.date?.message}>
        <input
          type="date"
          className={CONTROL_CLASS}
          {...fieldA11yProps('contribution-date', errors.date?.message)}
          {...register('date')}
        />
      </FormField>

      <FormField id="contribution-note" label="Note" optional error={errors.note?.message}>
        <input
          type="text"
          autoComplete="off"
          maxLength={CONTRIBUTION_NOTE_MAX_LENGTH}
          className={CONTROL_CLASS}
          {...fieldA11yProps('contribution-note', errors.note?.message)}
          {...register('note')}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{kind === 'deposit' ? 'Add money' : 'Withdraw'}</Button>
      </div>
    </form>
  );
}
