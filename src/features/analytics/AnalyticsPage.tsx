import { ChartPie } from 'lucide-react';
import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export function AnalyticsPage() {
  return (
    <PlaceholderPage
      icon={ChartPie}
      heading="Spending analytics"
      description="Interactive charts of income, expenses and category trends across reporting periods."
    />
  );
}
