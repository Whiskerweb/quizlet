import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CARDZ – App de révision 100% gratuite avec flashcards et mini-jeux',
  description: 'Révise tes cours gratuitement avec CARDZ : flashcards, quiz et mini-jeux, sans pub ni abonnement. App créée par et pour la communauté étudiante.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}





