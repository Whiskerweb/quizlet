import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cardz - Flashcards Intelligentes & Révision Espacée Gratuite',
    description: 'Révise plus efficacement avec Cardz, la plateforme 100% gratuite de flashcards intelligentes. Répétition espacée, quiz adaptatifs, statistiques détaillées.',
    keywords: [
        'flashcards',
        'révision espacée',
        'révision gratuite',
        'flashcards gratuites',
        'quiz étudiant',
        'mémorisation',
        'révision examen',
        'révision bac',
        'cardz',
        'apprendre efficacement',
        'révision intelligente',
        'étudiant',
        'lycée',
        'université'
    ],
    openGraph: {
        title: 'Cardz - Révise Plus Efficacement. 100% Gratuit.',
        description: 'Plateforme de flashcards intelligentes 100% gratuite. Répétition espacée, quiz adaptatifs, 0 publicité.',
        type: 'website',
        locale: 'fr_FR',
        siteName: 'Cardz',
        images: [
            {
                url: '/og-student.png',
                width: 1200,
                height: 630,
                alt: 'Cardz - Plateforme de flashcards gratuites pour étudiants'
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Cardz - Flashcards Intelligentes Gratuites',
        description: 'Révise plus efficacement. 100% gratuit, 0 pub.',
        images: ['/og-student.png'],
    },
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: 'https://cardz.dev/etudiants',
    },
    authors: [{ name: 'Cardz Team' }],
    category: 'education',
};

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
