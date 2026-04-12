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
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-content-muted" />
        <Input
          type="search"
          placeholder={placeholder}
          className={cn(
            'h-11 sm:h-12 pl-12 pr-4 rounded-full border border-border-subtle bg-bg-emphasis/90 shadow-sm',
            'focus-visible:border-brand-primary focus-visible:ring-brand-primary/30 text-[14px] text-content-emphasis placeholder:text-content-subtle'
          )}
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
    </div>
  );
}

