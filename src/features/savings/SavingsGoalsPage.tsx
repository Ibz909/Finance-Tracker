import { PiggyBank } from 'lucide-react';
import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export function SavingsGoalsPage() {
  return (
    <PlaceholderPage
      icon={PiggyBank}
      heading="Savings goals"
      description="Create goals such as an emergency fund or holiday, and record money set aside towards them."
    />
  );
}
