import { FlaskConical } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { hasDemoData } from '../../features/demo/demoData';
import { useAppData } from '../../hooks/useAppData';

/**
 * A one-line reminder that fictional data is on screen, so demo figures are
 * never mistaken for real finances. Hidden on Settings, where the demo data
 * section explains it in full.
 */
export function DemoDataBanner() {
  const data = useAppData();
  const { pathname } = useLocation();

  if (!hasDemoData(data) || pathname === '/settings') return null;

  return (
    <p className="mb-5 flex items-start gap-2 text-sm text-muted-foreground">
      <FlaskConical aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
      <span>
        <span className="font-medium text-foreground">Demo data</span> · fictional records, marked
        “Demo” wherever they appear.{' '}
        <Link to="/settings#demo-data" className="font-medium text-accent hover:underline">
          Manage demo data
        </Link>
      </span>
    </p>
  );
}
