import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { CONTROL_CLASS, fieldA11yProps } from '../../components/ui/formControl';
import { getCategoriesByType, isCategoryForType } from '../../constants/categories';
import { useToast } from '../../hooks/useToast';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import type { Transaction, TransactionDraft } from '../../models/transaction';
import { DESCRIPTION_MAX_LENGTH, NOTES_MAX_LENGTH } from '../../models/transaction';
import { todayIsoDate } from '../../utils/dates';
import type { TransactionFormValues } from './transactionFormSchema';
import { emptyFormValues, toFormValues, transactionFormSchema } from './transactionFormSchema';

interface TransactionFormProps {
  /** The transaction being edited; omit to add a new one. */
  transaction?: Transaction | undefined;
  onDone: () => void;
}

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense', icon: ArrowUpRight },
  { value: 'income', label: 'Income', icon: ArrowDownLeft },
] as const;

export function TransactionForm({ transaction, onDone }: TransactionFormProps) {
  const { addTransaction, updateTransaction } = useTransactionActions();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    setError,
    formState: { errors },
  } = useForm<TransactionFormValues, unknown, TransactionDraft>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: transaction ? toFormValues(transaction) : emptyFormValues(todayIsoDate()),
  });

  const type = useWatch({ control, name: 'type' });

  function onSubmit(draft: TransactionDraft) {
    const result = transaction ? updateTransaction(transaction.id, draft) : addTransaction(draft);
    if (!result.ok) {
      // Defence in depth: the form schema should already have caught this.
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        const name = (field === 'amountPence' ? 'amount' : field) as keyof TransactionFormValues;
        setError(name, { message: messages?.[0] ?? 'Check this field' });
      }
      return;
    }
    showToast(transaction ? 'Transaction updated' : 'Transaction added');
    onDone();
  }

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
                  onChange: (event: { target: { value: TransactionFormValues['type'] } }) => {
                    // A salary can't be an expense: clear a category that no longer fits.
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

      <FormField id="transaction-amount" label="Amount" error={errors.amount?.message}>
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
            {...fieldA11yProps('transaction-amount', errors.amount?.message)}
            {...register('amount')}
          />
        </div>
      </FormField>

      <FormField id="transaction-category" label="Category" error={errors.categoryId?.message}>
        <select
          className={CONTROL_CLASS}
          {...fieldA11yProps('transaction-category', errors.categoryId?.message)}
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
        id="transaction-description"
        label="Description"
        error={errors.description?.message}
      >
        <input
          type="text"
          autoComplete="off"
          maxLength={DESCRIPTION_MAX_LENGTH}
          placeholder={type === 'income' ? 'e.g. November salary' : 'e.g. Weekly shop'}
          className={CONTROL_CLASS}
          {...fieldA11yProps('transaction-description', errors.description?.message)}
          {...register('description')}
        />
      </FormField>

      <FormField id="transaction-date" label="Date" error={errors.date?.message}>
        <input
          type="date"
          className={CONTROL_CLASS}
          {...fieldA11yProps('transaction-date', errors.date?.message)}
          {...register('date')}
        />
      </FormField>

      <FormField id="transaction-notes" label="Notes" optional error={errors.notes?.message}>
        <textarea
          rows={3}
          maxLength={NOTES_MAX_LENGTH}
          className={`${CONTROL_CLASS} resize-y`}
          {...fieldA11yProps('transaction-notes', errors.notes?.message)}
          {...register('notes')}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{transaction ? 'Save changes' : 'Add transaction'}</Button>
      </div>
    </form>
  );
}
