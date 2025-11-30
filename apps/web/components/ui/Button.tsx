import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon' | 'lightPrimary';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'font-medium rounded-[999px] transition-all duration-[180ms] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
    
    const variants = {
      primary: 'bg-brand-primary text-white shadow-[0_10px_24px_rgba(66,85,255,0.45)] hover:bg-dark-states-primaryHover active:bg-dark-states-primaryActive focus:ring-brand-primary',
      secondary: 'bg-dark-background-cardMuted text-dark-text-primary border border-[rgba(255,255,255,0.12)] hover:bg-dark-states-surfaceHover focus:ring-[rgba(255,255,255,0.12)]',
      outline: 'border-2 border-brand-primary text-brand-primary hover:bg-dark-background-cardMuted focus:ring-brand-primary',
      ghost: 'bg-transparent text-dark-text-secondary hover:bg-[rgba(255,255,255,0.06)] focus:ring-[rgba(255,255,255,0.12)]',
      icon: 'w-10 h-10 rounded-[999px] bg-dark-background-cardMuted text-dark-text-secondary hover:bg-dark-states-surfaceHover focus:ring-[rgba(255,255,255,0.12)] p-0',
      lightPrimary: 'bg-brand-primary text-white shadow-[0_10px_26px_rgba(66,85,255,0.45)] hover:bg-dark-states-primaryHover focus:ring-brand-primary',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-[14px]',
      md: 'px-[18px] py-[10px] text-[14px]',
      lg: 'px-6 py-3 text-[16px]',
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




