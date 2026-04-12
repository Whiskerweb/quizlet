import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full h-11 px-4 rounded-xl border border-border-subtle bg-bg-emphasis shadow-sm',
          'text-content-emphasis text-[14px] placeholder:text-content-muted',
          'focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-emphasis',
          'transition-colors duration-200',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';


