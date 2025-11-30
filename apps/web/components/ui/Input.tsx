import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full h-11 px-4 rounded-lg bg-dark-background-cardMuted border border-[rgba(255,255,255,0.06)]',
          'text-dark-text-primary text-[14px] placeholder:text-dark-text-placeholder',
          'focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:ring-opacity-60',
          'transition-all duration-[180ms]',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';


