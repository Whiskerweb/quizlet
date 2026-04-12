import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon' | 'lightPrimary';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-emphasis disabled:opacity-50 disabled:pointer-events-none';

    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:
        'bg-brand-primary text-white shadow-primary-glow hover:bg-brand-primaryDark focus-visible:ring-brand-primary/40',
      secondary:
        'bg-bg-subtle text-content-emphasis border border-border-subtle hover:bg-bg-muted focus-visible:ring-border-muted',
      outline:
        'border border-border-emphasis bg-transparent text-content-emphasis hover:bg-bg-muted/70 focus-visible:ring-border-emphasis/60',
      ghost:
        'bg-transparent text-content-muted hover:bg-bg-muted/70 focus-visible:ring-border-subtle/60',
      icon:
        'w-11 h-11 rounded-2xl border border-border-subtle bg-bg-emphasis text-content-emphasis hover:shadow-card focus-visible:ring-border-emphasis/50 p-0',
      lightPrimary:
        'bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white shadow-primary-glow hover:brightness-110 focus-visible:ring-brand-primary/50',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'px-3.5 py-2 text-[13px]',
      md: 'px-5 py-2.5 text-[14px]',
      lg: 'px-6 py-3 text-[15px]',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], variant !== 'icon' && sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';




