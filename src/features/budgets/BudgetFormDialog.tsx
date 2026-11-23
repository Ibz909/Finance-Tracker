import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { CONTROL_CLASS, fieldA11yProps } from '../../components/ui/formControl';
import { getCategoriesByType } from '../../constants/categories';
import { useAppData } from '../../hooks/useAppData';
import { useBudgetActions } from '../../hooks/useBudgetActions';
import { useToast } from '../../hooks/useToast';
import type { Budget, BudgetDraft } from '../../models/budget';
import { budgetKey } from '../../models/budget';
import { budgetLabel } from './budgetLabel';
import type { BudgetFormValues } from './budgetFormSchema';
import { budgetFormSchema, toBudgetFormValues } from './budgetFormSchema';

export type BudgetDialogState =
  { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; budget: Budget };

interface BudgetFormDialogProps {
  state: BudgetDialogState;
  onClose: () => void;
}

export function BudgetFormDialog({ state, onClose }: BudgetFormDialogProps) {
  const editing = state.mode === 'edit' ? state.budget : undefined;
  return (
    <Dialog
      open={state.mode !== 'closed'}
      onClose={onClose}
      title={editing ? `Edit ${budgetLabel(editing)} budget` : 'Add budget'}
      description="Budgets are monthly limits that apply to every month."
    >
      {editing ? (
        <EditLimitForm key={editing.id} budget={editing} onDone={onClose} />
      ) : (
        <AddBudgetForm onDone={onClose} />
      )}
    </Dialog>
  );
}

function AddBudgetForm({ onDone }: { onDone: () => void }) {
  const { budgets } = useAppData();
  const { addBudget } = useBudgetActions();
  const { showToast } = useToast();

  const taken = new Set(budgets.map(budgetKey));
  const hasOverall = taken.has('overall');
  const availableCategories = getCategoriesByType('expense').filter(
    (c) => !taken.has(budgetKey({ scope: 'category', categoryId: c.id })),
  );

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<BudgetFormValues, unknown, BudgetDraft>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: { scope: hasOverall ? 'category' : 'overall', categoryId: '', limit: '' },
  });
  const scope = useWatch({ control, name: 'scope' });

  function onSubmit(draft: BudgetDraft) {
    const result = addBudget(draft);
    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        const name = (field === 'limitPence' ? 'limit' : field) as keyof BudgetFormValues;
        setError(name, { message: messages?.[0] ?? 'Check this field' });
      }
      return;
    }
    showToast('Budget added');
    onDone();
  }

  if (hasOverall && availableCategories.length === 0) {
    return (
      <div className="space-y-5">
        <p className="text-sm">
          You already have an overall budget and a budget for every spending category. Edit an
          existing budget to change its limit.
        </p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onDone} data-autofocus>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Budget for</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <ScopeOption
            value="overall"
            label="All spending"
            hint={hasOverall ? 'You already have one' : 'One limit for the whole month'}
            disabled={hasOverall}
            register={register}
          />
          <ScopeOption
            value="category"
            label="One category"
            hint="A separate limit for a single category"
            disabled={availableCategories.length === 0}
            register={register}
          />
        </div>
        {errors.scope && <p className="mt-1.5 text-sm text-negative">{errors.scope.message}</p>}
      </fieldset>

      {scope === 'category' && (
        <FormField id="budget-category" label="Category" error={errors.categoryId?.message}>
          <select
            className={CONTROL_CLASS}
            {...fieldA11yProps('budget-category', errors.categoryId?.message)}
            {...register('categoryId')}
          >
            <option value="">Choose a category</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <LimitField register={register} error={errors.limit?.message} />

      <FormActions submitLabel="Add budget" onCancel={onDone} />
    </form>
  );
}

function EditLimitForm({ budget, onDone }: { budget: Budget; onDone: () => void }) {
  const { updateBudgetLimit } = useBudgetActions();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BudgetFormValues, unknown, BudgetDraft>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: toBudgetFormValues(budget),
  });

  function onSubmit(draft: BudgetDraft) {
    const result = updateBudgetLimit(budget.id, draft.limitPence);
    if (!result.ok) {
      setError('limit', { message: result.fieldErrors.limitPence?.[0] ?? 'Check this limit' });
      return;
    }
    showToast('Budget updated');
    onDone();
  }

  return (
    <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
      <LimitField register={register} error={errors.limit?.message} />
      <p className="text-sm text-muted-foreground">
        To budget for a different category, delete this budget and add a new one.
      </p>
      <FormActions submitLabel="Save changes" onCancel={onDone} />
    </form>
  );
}

type Register = ReturnType<typeof useForm<BudgetFormValues, unknown, BudgetDraft>>['register'];

function ScopeOption({
  value,
  label,
  hint,
  disabled,
  register,
}: {
  value: BudgetFormValues['scope'];
  label: string;
  hint: string;
  disabled: boolean;
  register: Register;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors duration-150 hover:bg-muted has-checked:border-accent has-checked:bg-accent/10 has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-accent">
      <input
        type="radio"
        value={value}
        disabled={disabled}
        className="mt-1 accent-(--accent)"
        {...register('scope')}
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

function LimitField({ register, error }: { register: Register; error: string | undefined }) {
  return (
    <FormField id="budget-limit" label="Monthly limit" error={error}>
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
          {...fieldA11yProps('budget-limit', error)}
          {...register('limit')}
        />
      </div>
    </FormField>
  );
}

function FormActions({ submitLabel, onCancel }: { submitLabel: string; onCancel: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">{submitLabel}</Button>
    </div>
  );
}
