import { LayoutDashboard } from 'lucide-react';
import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export function DashboardPage() {
  return (
    <PlaceholderPage
      icon={LayoutDashboard}
      heading="Your financial overview"
      description="Income, expenses, net cash flow and savings rate for the selected month will appear here once transactions can be added."
    />
  );
}
