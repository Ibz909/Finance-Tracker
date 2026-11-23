import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { ThemePreference } from '../../services/theme';

const OPTIONS: { value: ThemePreference; label: string; description: string; icon: LucideIcon }[] =
  [
    { value: 'light', label: 'Light', description: 'Always use the light theme', icon: Sun },
    { value: 'dark', label: 'Dark', description: 'Always use the dark theme', icon: Moon },
    {
      value: 'system',
      label: 'System',
      description: 'Match your device setting',
      icon: Monitor,
    },
  ];

export function AppearanceSettings() {
  const { preference, setPreference, saveFailed } = useTheme();

  return (
    <section
      aria-labelledby="appearance-heading"
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
    >
      <h2 id="appearance-heading" className="text-base font-semibold">
        Appearance
      </h2>
      <fieldset className="mt-4">
        <legend className="text-sm text-muted-foreground">Theme</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {OPTIONS.map(({ value, label, description, icon: Icon }) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition-colors duration-150 hover:bg-muted has-checked:border-accent has-checked:bg-accent/10 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={preference === value}
                onChange={() => {
                  setPreference(value);
                }}
                className="sr-only"
              />
              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-sm text-muted-foreground">{description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {saveFailed && (
        <p role="status" className="mt-4 text-sm text-warning">
          Your browser blocked saving this preference, so it will reset next time you visit.
        </p>
      )}
    </section>
  );
}
