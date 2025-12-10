import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Notre Modèle - Cardz.dev | Transparence et Éthique',
    description: 'Comment Cardz.dev reste 100% gratuit tout en respectant votre vie privée. Notre engagement de transparence radicale.',
    robots: {
        index: true,
        follow: true,
    },
};

export default function NotreModeleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
