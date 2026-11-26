import { FlaskConical } from 'lucide-react';
import { hasDemoData } from '../../features/demo/demoData';
import { useAppData } from '../../hooks/useAppData';
import { useDemoDataActions } from '../../hooks/useDemoDataActions';
import { useToast } from '../../hooks/useToast';

/**
 * Top-bar switch that loads or clears the fictional demo data. "On" simply
 * means demo records exist, so it starts off for every new visitor and can't
 * drift out of step with the data. Clearing never touches the user's own
 * records, and needs no confirmation because the demo can be reloaded.
 */
export function DemoDataToggle() {
  const data = useAppData();
  const { loadDemoData, clearDemoData } = useDemoDataActions();
  const { showToast } = useToast();
  const on = hasDemoData(data);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      // The visible "On"/"Off" is the switch's state, which aria-checked
      // already announces, so the name is just the label.
      aria-label="Demo data"
      title={on ? 'Turn off demo data' : 'Turn on demo data'}
      onClick={() => {
        if (on) {
          clearDemoData();
          showToast('Demo data turned off');
        } else {
          loadDemoData();
          showToast('Demo data turned on');
        }
      }}
      className={`inline-flex h-11 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors duration-150 hover:bg-muted sm:h-9 ${
        on ? 'border-input-border text-foreground' : 'border-border text-muted-foreground'
      }`}
    >
      <FlaskConical aria-hidden="true" className={`size-4 shrink-0 ${on ? 'text-accent' : ''}`} />
      {/* Phones show just the icon and state, to fit beside the title. */}
      <span aria-hidden="true" className="hidden sm:inline">
        Demo data:
      </span>
      <span aria-hidden="true">{on ? 'On' : 'Off'}</span>
    </button>
  );
}
