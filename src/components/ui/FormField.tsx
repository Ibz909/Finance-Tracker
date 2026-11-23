import type { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

/**
 * Label, control, hint and error laid out consistently. The control itself
 * must use `fieldA11yProps(id, error, hint)` from formControl.ts so assistive technology reads
 * the hint and error together with the label.
 */
export function FormField({ id, label, error, hint, optional, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-negative">
          {error}
        </p>
      )}
    </div>
  );
}
