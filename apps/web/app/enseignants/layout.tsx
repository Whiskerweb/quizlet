import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cardz Enseignants - Évaluation Formative Gratuite | Quiz & Analytics',
    description: 'Plateforme gratuite d\'évaluation formative pour enseignants. Quiz en direct, analytics détaillés, intégration LMS, conformité RGPD. Classes et élèves illimités.',
    keywords: [
        'évaluation formative',
        'quiz classe gratuit',
        'outil enseignant gratuit',
        'quiz en direct',
        'google classroom',
        'analytics élèves',
        'RGPD enseignement',
        'LMS integration',
        'tableau de bord classe',
        'engagement élèves',
        'pédagogie différenciée',
        'cardz enseignants'
    ],
    openGraph: {
        title: 'Cardz Enseignants - L\'Engagement en Classe, Sans la Facture',
        description: 'Plateforme d\'évaluation formative 100% gratuite. Classes illimitées, analytics complets, conformité RGPD.',
        type: 'website',
        locale: 'fr_FR',
        siteName: 'Cardz',
        images: [
            {
                url: '/og-teacher.png',
                width: 1200,
                height: 630,
                alt: 'Cardz pour Enseignants - Outils gratuits d\'évaluation formative'
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Cardz Enseignants - Quiz & Analytics Gratuits',
        description: 'Classes illimitées, élèves illimités. 100% gratuit.',
        images: ['/og-teacher.png'],
    },
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: 'https://cardz.dev/enseignants',
    },
    authors: [{ name: 'Cardz Team' }],
    category: 'education',
};

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
