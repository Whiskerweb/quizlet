'use client';

import { BookOpen, Share2, TrendingUp, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { BentoCard, BentoGrid } from './BentoGrid';
import Marquee from './Marquee';
import { AnimatedListDemo } from './AnimatedListDemo';
import { ProgressChart } from './ProgressChart';
import { FileOrganization } from './FileOrganization';

const cardz = [
  {
    name: 'Histoire - Révolution',
    body: 'Les dates clés de la Révolution française et leurs conséquences.',
  },
  {
    name: 'Maths - Algèbre',
    body: 'Formules et théorèmes essentiels pour le bac.',
  },
  {
    name: 'SVT - Biologie',
    body: 'Les mécanismes de la photosynthèse et de la respiration cellulaire.',
  },
  {
    name: 'Anglais - Vocabulaire',
    body: 'Les mots essentiels pour réussir tes examens d\'anglais.',
  },
  {
    name: 'Physique - Mécanique',
    body: 'Les lois de Newton et leurs applications pratiques.',
  },
];

const features = [
  {
    Icon: BookOpen,
    name: 'Crée et organise tes Cardz',
    description: 'Crée tes propres Cardz à partir de tes cours. Ajoute définitions, notions, formules, dates importantes… Classe tes Cardz par matières, chapitres ou dossiers.',
    href: '/register',
    cta: 'En savoir plus',
    className: 'col-span-3 lg:col-span-1',
    background: (
      <Marquee
        pauseOnHover
        className="absolute top-10 [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] [--duration:20s]"
      >
        {cardz.map((f, idx) => (
          <figure
            key={idx}
            className={cn(
              'relative w-32 cursor-pointer overflow-hidden rounded-xl border p-4',
              'border-gray-200 bg-white hover:bg-gray-50',
              'dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800',
              'transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none'
            )}
          >
            <div className="flex flex-row items-center gap-2">
              <div className="flex flex-col">
                <figcaption className="text-sm font-medium text-gray-900 dark:text-white">
                  {f.name}
                </figcaption>
              </div>
            </div>
            <blockquote className="mt-2 text-xs text-gray-600 dark:text-gray-400">{f.body}</blockquote>
          </figure>
        ))}
      </Marquee>
    ),
  },
  {
    Icon: Share2,
    name: 'Partage et découvre',
    description: 'Partage tes Cardz avec tes potes en un lien. Choisis si tes Cardz sont publics ou privés. Découvre des Cardz créés par d\'autres étudiants.',
    href: '/register',
    cta: 'En savoir plus',
    className: 'col-span-3 lg:col-span-2',
    background: (
      <AnimatedListDemo className="absolute top-0 right-0 h-full w-[60%] scale-100 border-none [mask-image:linear-gradient(to_left,transparent_0%,#000_20%,#000_80%,transparent_100%)] transition-all duration-300 ease-out group-hover:scale-105" />
    ),
  },
  {
    Icon: TrendingUp,
    name: 'Suis ta progression',
    description: 'Système d\'XP et de niveaux pour mesurer tes efforts. Achievements à débloquer. Statistiques pour voir ce que tu maîtrises déjà.',
    href: '/register',
    cta: 'En savoir plus',
    className: 'col-span-3 lg:col-span-2',
    background: (
      <ProgressChart className="absolute top-0 right-0 h-full w-full [mask-image:linear-gradient(to_left,transparent_0%,#000_30%,#000_70%,transparent_100%)] transition-all duration-300 ease-out group-hover:opacity-90" />
    ),
  },
  {
    Icon: FolderOpen,
    name: 'Organise tes révisions',
    description: 'Classe tes Cardz par matières, chapitres ou dossiers pour t\'y retrouver facilement. Interface simple et intuitive.',
    className: 'col-span-3 lg:col-span-1',
    href: '/register',
    cta: 'En savoir plus',
    background: (
      <FileOrganization className="absolute top-0 right-0 h-full w-full [mask-image:linear-gradient(to_left,transparent_0%,#000_30%,#000_70%,transparent_100%)] transition-all duration-300 ease-out group-hover:opacity-90" />
    ),
  },
];

export function BentoDemo() {
  return (
    <BentoGrid>
      {features.map((feature, idx) => (
        <BentoCard key={idx} {...feature} />
      ))}
    </BentoGrid>
  );
}

