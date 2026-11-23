import { ArrowLeftRight } from 'lucide-react';
import { PlaceholderPage } from '../../components/ui/PlaceholderPage';

export function TransactionsPage() {
  return (
    <PlaceholderPage
      icon={ArrowLeftRight}
      heading="Transaction history"
      description="You will be able to add, edit and delete income and expense transactions here."
    />
  );
}
