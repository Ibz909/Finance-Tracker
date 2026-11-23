import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';

/**
 * Quick light/dark switch for the top bar. Choosing "match system" lives
 * in Settings → Appearance.
 */
export function ThemeToggle() {
  const { resolvedTheme, setPreference } = useTheme();
  const next = resolvedTheme === 'dark' ? 'light' : 'dark';
  const Icon = resolvedTheme === 'dark' ? Sun : Moon;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => {
        setPreference(next);
      }}
    >
      <Icon aria-hidden="true" className="size-5" />
    </Button>
  );
}
