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
}: SegmentedControlProps<T>) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="flex gap-0.5 rounded-md border border-border p-0.5">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex h-10 min-w-11 cursor-pointer sm:h-8 items-center justify-center rounded-sm px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground has-checked:bg-muted has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-accent"
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
