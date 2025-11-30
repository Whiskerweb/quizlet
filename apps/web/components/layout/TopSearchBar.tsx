'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

interface TopSearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (value: string) => void;
}

export function TopSearchBar({ placeholder = 'Rechercher...', className, onSearch }: TopSearchBarProps) {
  return (
    <div className={cn('relative flex-1 max-w-2xl', className)}>
      <div className="relative">
        <Search className="absolute left-[14px] sm:left-[18px] top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-dark-text-placeholder pointer-events-none" />
        <Input
          type="search"
          placeholder={placeholder}
          className={cn(
            'h-10 sm:h-11 pl-[42px] sm:pl-[50px] pr-[14px] sm:pr-[18px] rounded-[999px]',
            'bg-dark-background-card border-none shadow-[0_0_0_1px_rgba(255,255,255,0.06)]',
            'focus:shadow-[0_0_0_2px_rgba(66,85,255,0.6)] focus:border-white',
            'text-[14px] sm:text-[14px] text-dark-text-primary placeholder:text-dark-text-placeholder'
          )}
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
    </div>
  );
}

