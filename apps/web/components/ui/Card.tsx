import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'hero' | 'listItem' | 'emptyState' | 'lightMarketing';
}

export function Card({ className, children, variant = 'default', ...props }: CardProps) {
  const variants = {
    default: 'bg-dark-background-card rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.28)] p-4 sm:p-5 lg:p-6',
    hero: 'bg-dark-background-card rounded-[24px] shadow-[0_12px_32px_rgba(0,0,0,0.36)] p-5 sm:p-6 lg:p-7',
    listItem: 'bg-dark-background-cardMuted rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.28)] p-4 sm:p-5',
    emptyState: 'bg-dark-background-base rounded-none p-6 sm:p-8',
    lightMarketing: 'bg-light-background-card rounded-xl shadow-[0_14px_40px_rgba(16,30,115,0.14)] p-6 sm:p-8',
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
    <div className={cn('mb-1', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-[15px] sm:text-[16px] font-semibold text-white leading-tight', className)} {...props}>
      {children}
    </h3>
  );
}

