import { Wallet } from 'lucide-react';
import { APP_NAME } from '../../constants/navigation';

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-md bg-accent-fill text-accent-fill-foreground">
        <Wallet aria-hidden="true" className="size-5" />
      </span>
      <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
    </span>
  );
}
