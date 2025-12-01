'use client';

import { cn } from '@/lib/utils/cn';
import { AnimatedList } from './AnimatedList';

interface Item {
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
}

let notifications: Item[] = [
  {
    name: 'Set partagé',
    description: 'Histoire - Révolution française',
    time: 'Il y a 2 min',
    icon: '📚',
    color: '#60A5FA',
  },
  {
    name: 'Nouveau set découvert',
    description: 'Maths - Algèbre avancée',
    time: 'Il y a 5 min',
    icon: '🔍',
    color: '#34D399',
  },
  {
    name: 'Set partagé',
    description: 'SVT - Biologie cellulaire',
    time: 'Il y a 10 min',
    icon: '📚',
    color: '#60A5FA',
  },
  {
    name: 'Nouveau set découvert',
    description: 'Anglais - Vocabulaire business',
    time: 'Il y a 15 min',
    icon: '🔍',
    color: '#34D399',
  },
  {
    name: 'Set partagé',
    description: 'Physique - Mécanique quantique',
    time: 'Il y a 20 min',
    icon: '📚',
    color: '#60A5FA',
  },
  {
    name: 'Nouveau set découvert',
    description: 'Chimie - Réactions organiques',
    time: 'Il y a 25 min',
    icon: '🔍',
    color: '#34D399',
  },
];

notifications = Array.from({ length: 3 }, () => notifications).flat();

const Notification = ({ name, description, icon, color, time }: Item) => {
  return (
    <figure
      className={cn(
        'relative mx-auto min-h-fit w-full max-w-[350px] cursor-pointer overflow-hidden rounded-2xl p-3',
        'transition-all duration-200 ease-in-out hover:scale-[103%]',
        'bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
        'transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]'
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-8 items-center justify-center rounded-xl"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-sm">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-sm font-medium whitespace-pre text-gray-900 dark:text-white">
            <span className="text-xs sm:text-sm">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-xs font-normal text-gray-600 dark:text-white/60">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

export function AnimatedListDemo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden p-4',
        className
      )}
    >
      <AnimatedList>
        {notifications.map((item, idx) => (
          <Notification {...item} key={idx} />
        ))}
      </AnimatedList>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-slate-900 to-transparent"></div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-slate-900 to-transparent"></div>
    </div>
  );
}

