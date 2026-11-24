import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { CONTROL_CLASS, fieldA11yProps } from '../../components/ui/formControl';
import { getCategoriesByType, isCategoryForType } from '../../constants/categories';
import { useClock } from '../../hooks/useAppData';
import { useRecurringActions } from '../../hooks/useRecurringActions';
import { useToast } from '../../hooks/useToast';
import type { RecurringDraft, RecurringSchedule } from '../../models/recurring';
import { FREQUENCIES } from '../../models/recurring';
import { DESCRIPTION_MAX_LENGTH, NOTES_MAX_LENGTH } from '../../models/transaction';
import { todayIsoDate } from '../../utils/dates';
import { earliestStartDate, MAX_BACKDATE_MONTHS } from './recurringCommands';
import type { RecurringFormValues } from './recurringFormSchema';
import {
  emptyRecurringValues,
  recurringFormSchema,
  toRecurringFormValues,
} from './recurringFormSchema';
import { FREQUENCY_LABELS } from './schedule';

export type RecurringDialogState =
  { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; schedule: RecurringSchedule };

interface RecurringFormDialogProps {
  state: RecurringDialogState;
  onClose: () => void;
}

export function RecurringFormDialog({ state, onClose }: RecurringFormDialogProps) {
  const editing = state.mode === 'edit' ? state.schedule : undefined;
  return (
    <Dialog
      open={state.mode !== 'closed'}
      onClose={onClose}
      title={editing ? 'Edit recurring transaction' : 'Add recurring transaction'}
      description={
        editing
          ? 'Changes apply to future payments. Transactions already added stay as they are.'
          : 'Each payment is added to your transactions automatically when it falls due.'
      }
    >
      {state.mode !== 'closed' && (
        <RecurringForm key={editing?.id ?? 'new'} schedule={editing} onDone={onClose} />
      )}
    </Dialog>
  );
}

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense', icon: ArrowUpRight },
  { value: 'income', label: 'Income', icon: ArrowDownLeft },
] as const;

function RecurringForm({
  schedule,
  onDone,
}: {
  schedule: RecurringSchedule | undefined;
  onDone: () => void;
}) {
  const { addSchedule, updateSchedule } = useRecurringActions();
  const { showToast } = useToast();
  const today = todayIsoDate(useClock()());

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    setError,
    formState: { errors },
  } = useForm<RecurringFormValues, unknown, RecurringDraft>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: schedule ? toRecurringFormValues(schedule) : emptyRecurringValues(today),
  });
  const type = useWatch({ control, name: 'type' });

  function onSubmit(draft: RecurringDraft) {
    const result = schedule ? updateSchedule(schedule, draft) : addSchedule(draft);
    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        const name = (field === 'amountPence' ? 'amount' : field) as keyof RecurringFormValues;
        setError(name, { message: messages?.[0] ?? 'Check this field' });
      }
      return;
    }
    showToast(schedule ? 'Recurring transaction updated' : 'Recurring transaction added');
    onDone();
  }

  const prefix = 'recurring';
  const startHint = schedule
    ? 'Changing this recalculates payments from today.'
    : `Up to ${String(MAX_BACKDATE_MONTHS)} months ago. Past payments are added straight away.`;
  const endHint = 'Leave blank to repeat until you stop it.';
  return (
    <form noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="space-y-5">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Type</legend>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors duration-150 has-checked:bg-surface has-checked:text-foreground has-checked:shadow-[inset_0_-2px_0_var(--color-accent),0_1px_2px_rgb(0_0_0/0.06)] has-focus-visible:outline-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                value={value}
                className="sr-only"
                {...register('type', {
                  onChange: (event: { target: { value: RecurringFormValues['type'] } }) => {
                    if (!isCategoryForType(getValues('categoryId'), event.target.value)) {
                      setValue('categoryId', '');
                    }
                  },
                })}
              />
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <FormField id={`${prefix}-amount`} label="Amount" error={errors.amount?.message}>
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
            {...fieldA11yProps(`${prefix}-amount`, errors.amount?.message)}
            {...register('amount')}
          />
        </div>
      </FormField>

      <FormField id={`${prefix}-category`} label="Category" error={errors.categoryId?.message}>
        <select
          className={CONTROL_CLASS}
          {...fieldA11yProps(`${prefix}-category`, errors.categoryId?.message)}
          {...register('categoryId')}
        >
          <option value="">Choose a category</option>
          {getCategoriesByType(type).map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        id={`${prefix}-description`}
        label="Description"
        error={errors.description?.message}
      >
        <input
          type="text"
          autoComplete="off"
          maxLength={DESCRIPTION_MAX_LENGTH}
          placeholder={type === 'income' ? 'e.g. Monthly salary' : 'e.g. Rent'}
          className={CONTROL_CLASS}
          {...fieldA11yProps(`${prefix}-description`, errors.description?.message)}
          {...register('description')}
        />
      </FormField>

      <FormField id={`${prefix}-frequency`} label="Repeats" error={errors.frequency?.message}>
        <select
          className={CONTROL_CLASS}
          {...fieldA11yProps(`${prefix}-frequency`, errors.frequency?.message)}
          {...register('frequency')}
        >
          {FREQUENCIES.map((frequency) => (
            <option key={frequency} value={frequency}>
              {FREQUENCY_LABELS[frequency]}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id={`${prefix}-start`}
          label="First payment"
          hint={startHint}
          error={errors.startDate?.message}
        >
          <input
            type="date"
            min={schedule ? undefined : earliestStartDate(today)}
            className={CONTROL_CLASS}
            {...fieldA11yProps(`${prefix}-start`, errors.startDate?.message, startHint)}
            {...register('startDate')}
          />
        </FormField>

        <FormField
          id={`${prefix}-end`}
          label="Last payment"
          optional
          hint={endHint}
          error={errors.endDate?.message}
        >
          <input
            type="date"
            className={CONTROL_CLASS}
            {...fieldA11yProps(`${prefix}-end`, errors.endDate?.message, endHint)}
            {...register('endDate')}
          />
        </FormField>
      </div>

      <FormField id={`${prefix}-notes`} label="Notes" optional error={errors.notes?.message}>
        <textarea
          rows={2}
          maxLength={NOTES_MAX_LENGTH}
          className={`${CONTROL_CLASS} resize-y`}
          {...fieldA11yProps(`${prefix}-notes`, errors.notes?.message)}
          {...register('notes')}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{schedule ? 'Save changes' : 'Add recurring transaction'}</Button>
      </div>
    </form>
  );
}
