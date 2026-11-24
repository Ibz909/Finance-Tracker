import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { CONTROL_CLASS, fieldA11yProps } from '../../components/ui/formControl';
import { useSavingsActions } from '../../hooks/useSavingsActions';
import { useToast } from '../../hooks/useToast';
import type { GoalDraft, SavingsGoal } from '../../models/savings';
import { GOAL_NAME_MAX_LENGTH } from '../../models/savings';
import type { GoalFormValues } from './savingsFormSchemas';
import { goalFormSchema, toGoalFormValues } from './savingsFormSchemas';

export type GoalDialogState =
  { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; goal: SavingsGoal };

export function GoalFormDialog({
  state,
  onClose,
}: {
  state: GoalDialogState;
  onClose: () => void;
}) {
  const editing = state.mode === 'edit' ? state.goal : undefined;
  return (
    <Dialog
      open={state.mode !== 'closed'}
      onClose={onClose}
      title={editing ? `Edit ${editing.name}` : 'Add savings goal'}
      description="Set aside money towards something, and see how close you are."
    >
      {state.mode !== 'closed' && (
        <GoalForm key={editing?.id ?? 'new'} goal={editing} onDone={onClose} />
      )}
    </Dialog>
  );
}

function GoalForm({ goal, onDone }: { goal: SavingsGoal | undefined; onDone: () => void }) {
  const { addGoal, updateGoal } = useSavingsActions();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<GoalFormValues, unknown, GoalDraft>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: toGoalFormValues(goal),
  });

  function onSubmit(draft: GoalDraft) {
    const result = goal ? updateGoal(goal.id, draft) : addGoal(draft);
    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        const name = (field === 'targetPence' ? 'target' : field) as keyof GoalFormValues;
        setError(name, { message: messages?.[0] ?? 'Check this field' });
      }
      return;
    }
    showToast(goal ? 'Goal updated' : 'Goal added');
    onDone();
  }

  const dateHint = 'We’ll work out how much to save each month.';
  return (
    <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
      <FormField id="goal-name" label="Name" error={errors.name?.message}>
        <input
          type="text"
          autoComplete="off"
          maxLength={GOAL_NAME_MAX_LENGTH}
          placeholder="e.g. Emergency fund"
          data-autofocus
          className={CONTROL_CLASS}
          {...fieldA11yProps('goal-name', errors.name?.message)}
          {...register('name')}
        />
      </FormField>

      <FormField id="goal-target" label="Target amount" error={errors.target?.message}>
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
            className={`${CONTROL_CLASS} pl-7 tabular-nums`}
            {...fieldA11yProps('goal-target', errors.target?.message)}
            {...register('target')}
          />
        </div>
      </FormField>

      <FormField
        id="goal-date"
        label="Target date"
        optional
        hint={dateHint}
        error={errors.targetDate?.message}
      >
        <input
          type="date"
          className={CONTROL_CLASS}
          {...fieldA11yProps('goal-date', errors.targetDate?.message, dateHint)}
          {...register('targetDate')}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{goal ? 'Save changes' : 'Add goal'}</Button>
      </div>
    </form>
  );
}
