interface SegmentedControlProps<T extends string> {
  /** Read by screen readers as the group's name, e.g. "Chart range". */
  legend: string;
  name: string;
  value: T;
  options: readonly {
    value: T;
    label: string;
    /** Full wording for screen readers. */ srLabel?: string;
  }[];
  onChange: (value: T) => void;
  /**
   * "field" sits in a row of form fields: a visible legend like a field
   * label, full width and matching input height. Default: compact, legend hidden.
   */
  variant?: 'compact' | 'field';
  /** Keep the legend for screen readers only, e.g. in a toolbar beside a search box. */
  hideLegend?: boolean;
}

/**
 * Small single-choice control built from real radio buttons, so arrow keys
 * move between options and screen readers announce "radio, 2 of 3".
 */
export function SegmentedControl<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  variant = 'compact',
  hideLegend = false,
}: SegmentedControlProps<T>) {
  const field = variant === 'field';
  return (
    <fieldset>
      <legend className={field && !hideLegend ? 'mb-1.5 text-sm font-medium' : 'sr-only'}>
        {legend}
      </legend>
      <div
        className={`flex gap-0.5 rounded-md border p-0.5 ${field ? 'border-input-border' : 'border-border'}`}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex min-w-11 cursor-pointer items-center justify-center rounded-sm px-2.5 font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground has-checked:bg-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-accent ${field ? 'h-10 flex-1 text-sm has-checked:text-accent sm:h-[2.375rem]' : 'h-10 text-xs has-checked:text-foreground sm:h-8'}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(option.value);
              }}
              className="sr-only"
            />
            <span aria-hidden={option.srLabel ? true : undefined}>{option.label}</span>
            {option.srLabel && <span className="sr-only">{option.srLabel}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
