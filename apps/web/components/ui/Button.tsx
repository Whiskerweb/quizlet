import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'font-medium rounded-[999px] transition-all duration-[180ms] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
    
    const variants = {
      primary: 'bg-brand-primary text-white hover:bg-brand-primarySoft active:bg-brand-primaryDark shadow-[0_10px_24px_rgba(66,85,255,0.45)]',
      secondary: 'bg-dark-background-cardMuted text-dark-text-primary border border-dark-border-soft hover:bg-dark-states-surfaceHover',
      outline: 'bg-transparent border border-dark-border-soft text-dark-text-primary hover:bg-dark-states-surfaceHover',
      ghost: 'bg-transparent text-dark-text-secondary hover:bg-[rgba(255,255,255,0.06)]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-[14px]',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
