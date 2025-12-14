import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './game-effects.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CARDZ – App de révision 100% gratuite avec cardz et mini-jeux',
  description: 'Révise tes cours gratuitement avec CARDZ : cardz, quiz et mini-jeux, sans pub ni abonnement. App créée par et pour la communauté étudiante.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme-storage');
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    const currentTheme = parsed?.state?.theme || 'light';
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(currentTheme);
                  } else {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}





