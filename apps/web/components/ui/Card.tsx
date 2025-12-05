import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'hero' | 'listItem' | 'emptyState' | 'lightMarketing';
}

export function Card({ className, children, variant = 'default', ...props }: CardProps) {
  const variants = {
    default:
      'bg-bg-emphasis border border-border-subtle rounded-2xl shadow-card p-4 sm:p-5 lg:p-6',
    hero:
      'bg-gradient-to-br from-brand-primary to-brand-primaryDark text-white rounded-3xl shadow-panel p-5 sm:p-6 lg:p-7',
    listItem:
      'bg-bg-subtle border border-border-subtle rounded-2xl shadow-card p-4 sm:p-5',
    emptyState:
      'bg-bg-muted border border-dashed border-border-muted rounded-2xl p-6 sm:p-8',
    lightMarketing:
      'bg-white rounded-2xl shadow-panel p-6 sm:p-8 border border-border-subtle',
  };

  return (
    <div
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-3', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-[15px] sm:text-[16px] font-semibold text-content-emphasis leading-tight',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

