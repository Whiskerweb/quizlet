'use client';

import { cn } from '@/lib/utils/cn';
import Marquee from './Marquee';

const reviews = [
  {
    name: 'Alex',
    username: '@alex_student',
    body: "CARDZ m'a vraiment aidé à réviser mes examens. L'interface est super intuitive !",
    img: 'https://avatar.vercel.sh/alex',
  },
  {
    name: 'Sarah',
    username: '@sarah_etud',
    body: "Pouvons-nous ajouter la possibilité d'ajouter son programme ? Ce serait super pratique !",
    img: 'https://avatar.vercel.sh/sarah',
  },
  {
    name: 'Tom',
    username: '@tom_prepa',
    body: '100% gratuit et sans pub, c\'est exactement ce dont j\'avais besoin. Merci CARDZ !',
    img: 'https://avatar.vercel.sh/tom',
  },
  {
    name: 'Léa',
    username: '@lea_lycee',
    body: 'Pouvons-nous ajouter un nouveau jeu ? J\'aimerais bien un mode chrono pour me challenger !',
    img: 'https://avatar.vercel.sh/lea',
  },
  {
    name: 'Max',
    username: '@max_univ',
    body: 'L\'app évolue vraiment selon nos retours. L\'équipe est à l\'écoute !',
    img: 'https://avatar.vercel.sh/max',
  },
  {
    name: 'Emma',
    username: '@emma_etudiante',
    body: 'Serait-il possible d\'avoir des statistiques plus détaillées sur nos progrès ?',
    img: 'https://avatar.vercel.sh/emma',
  },
  {
    name: 'Lucas',
    username: '@lucas_etud',
    body: "J'adore les différents modes de révision. Ça rend l'apprentissage beaucoup plus fun !",
    img: 'https://avatar.vercel.sh/lucas',
  },
  {
    name: 'Chloé',
    username: '@chloe_prepa',
    body: 'Pourrait-on avoir un mode hors ligne ? Ça serait pratique pour réviser dans les transports.',
    img: 'https://avatar.vercel.sh/chloe',
  },
  {
    name: 'Hugo',
    username: '@hugo_lycee',
    body: 'Les Cardz communautaires sont géniaux. Je peux réviser avec les cartes créées par d\'autres.',
    img: 'https://avatar.vercel.sh/hugo',
  },
  {
    name: 'Inès',
    username: '@ines_univ',
    body: 'Serait-ce possible d\'ajouter des images dans les cardz ? Ça aiderait pour certaines matières.',
    img: 'https://avatar.vercel.sh/ines',
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        'relative h-full w-full cursor-pointer overflow-hidden rounded-xl border p-4',
        'border-gray-200 bg-white hover:bg-gray-50',
        'dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800'
      )}
    >
      <div className="flex flex-row items-center gap-2 mb-3">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium text-gray-900 dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{username}</p>
        </div>
      </div>
      <blockquote className="text-sm text-gray-700 dark:text-gray-300">{body}</blockquote>
    </figure>
  );
};

export function MarqueeDemoVertical() {
  return (
    <div className="relative flex h-[500px] w-full flex-row items-center justify-center overflow-hidden rounded-3xl">
      <Marquee pauseOnHover vertical className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover vertical className="[--duration:20s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-white to-transparent dark:from-gray-50"></div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white to-transparent dark:from-gray-50"></div>
    </div>
  );
}

