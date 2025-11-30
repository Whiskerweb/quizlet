import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full min-h-[80px] p-4 rounded-lg bg-dark-background-cardMuted border border-[rgba(255,255,255,0.06)]',
          'text-dark-text-primary text-[14px] placeholder:text-dark-text-placeholder',
          'focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:ring-opacity-60',
          'transition-all duration-[180ms] resize-none',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

