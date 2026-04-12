'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export function AnimatedList({ className, children, delay = 50 }: AnimatedListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!scrollerRef.current || !isClient) return;

    const scroller = scrollerRef.current;
    const scrollerContent = Array.from(scroller.children);

    // Dupliquer le contenu plusieurs fois pour une boucle infinie fluide
    scrollerContent.forEach((item) => {
      const duplicatedItem = item.cloneNode(true) as HTMLElement;
      duplicatedItem.setAttribute('aria-hidden', 'true');
      scroller.appendChild(duplicatedItem);
    });
    
    // Dupliquer encore une fois pour une boucle plus fluide
    const allItems = Array.from(scroller.children);
    allItems.forEach((item) => {
      const duplicatedItem = item.cloneNode(true) as HTMLElement;
      duplicatedItem.setAttribute('aria-hidden', 'true');
      scroller.appendChild(duplicatedItem);
    });
  }, [isClient]);

  return (
    <div
      ref={scrollerRef}
      className={cn(
        'scrollbar-hide flex h-full flex-col gap-3 overflow-hidden',
        'animate-scroll-vertical',
        'blur-[0.5px]',
        className
      )}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
      }}
    >
      {children}
    </div>
  );
}

