import { NavLink } from 'react-router';
import { NAV_ITEMS } from '../../constants/navigation';

interface NavListProps {
  /** Called after a link is chosen, e.g. so the mobile drawer can close. */
  onNavigate?: () => void;
}

export function NavList({ onNavigate }: NavListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
        <li key={path}>
          <NavLink
            to={path}
            end={path === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                'relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-accent/10 text-accent before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-accent'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              ].join(' ')
            }
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
