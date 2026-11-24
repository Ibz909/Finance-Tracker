import type { MonthKey } from '../../utils/dates';
import { rangeLabel } from './analytics';
import type { RangePresetId } from './ranges';
import { RANGE_PRESETS } from './ranges';

interface RangeSelectorProps {
  value: RangePresetId;
  months: readonly MonthKey[];
  onChange: (id: RangePresetId) => void;
}

/**
 * Segmented control built from real radio buttons, so arrow keys move
 * between options and screen readers announce "radio, 3 of 5".
 * The exact months are always shown, so "last 3 months" is never ambiguous.
 */
export function RangeSelector({ value, months, onChange }: RangeSelectorProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <fieldset>
        <legend className="sr-only">Date range</legend>
        <div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
          {RANGE_PRESETS.map((preset) => (
            <label
              key={preset.id}
              className="flex h-10 cursor-pointer items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground has-checked:bg-surface has-checked:text-foreground has-checked:shadow-[inset_0_-2px_0_var(--color-accent),0_1px_2px_rgb(0_0_0/0.06)] has-focus-visible:outline-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name="analytics-range"
                value={preset.id}
                checked={value === preset.id}
                onChange={() => {
                  onChange(preset.id);
                }}
                className="sr-only"
              />
              {preset.label}
            </label>
          ))}
        </div>
      </fieldset>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{rangeLabel(months)}</span>
      </p>
    </div>
  );
}
