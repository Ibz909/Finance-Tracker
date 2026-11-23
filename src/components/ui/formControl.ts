/** aria-invalid and aria-describedby for a control inside <FormField>. */
export function fieldA11yProps(id: string, error?: string, hint?: string) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  } as const;
}

/** Shared look for inputs, selects and textareas, including the error state. */
export const CONTROL_CLASS =
  'block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base text-foreground shadow-xs transition-colors duration-150 placeholder:text-muted-foreground hover:border-muted-foreground/50 aria-invalid:border-negative sm:text-sm';
