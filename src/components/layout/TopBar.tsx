interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
    </header>
  );
}
