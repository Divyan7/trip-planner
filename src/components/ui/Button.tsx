import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}

const styles: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100',
  secondary: 'border border-edge bg-raised hover:bg-accent-soft disabled:opacity-50',
  ghost: 'text-muted hover:text-ink hover:bg-edge/40 disabled:opacity-40',
  danger: 'bg-danger-soft text-danger hover:brightness-95 disabled:opacity-50',
};

export function Button({ variant = 'secondary', loading, children, disabled, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`press inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

interface IconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — an icon button without a label is invisible to AT. */
  'aria-label': string;
  children: ReactNode;
}

export function IconButton({ children, className = '', ...rest }: IconProps) {
  return (
    <button
      type="button"
      className={`press inline-flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-edge/50 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
