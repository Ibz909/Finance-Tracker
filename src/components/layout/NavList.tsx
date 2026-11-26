import { NavLink } from 'react-router';
import { NAV_ITEMS } from '../../constants/navigation';

interface NavListProps {
  /** Called after a link is chosen, e.g. so the mobile drawer can close. */
  onNavigate?: () => void;
}

export function NavList({ onNavigate }: NavListProps) {
  return (
    <ul className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
        <li key={path}>
          <NavLink
            to={path}
            end={path === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                'group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              ].join(' ')
            }
          >
            <Icon
              aria-hidden="true"
              className="size-[18px] shrink-0 group-aria-[current=page]:text-accent"
            />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
