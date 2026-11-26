import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent-fill text-accent-fill-foreground hover:bg-accent-fill/90',
  secondary: 'border border-input-border bg-transparent text-foreground hover:bg-muted',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger: 'bg-negative text-negative-foreground hover:bg-negative/90',
};

// Every size keeps at least a 44px touch target on small screens.
const SIZES: Record<ButtonSize, string> = {
  md: 'h-11 px-4 sm:h-10',
  icon: 'size-11 sm:size-10',
};

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
