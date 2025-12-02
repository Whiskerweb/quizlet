'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { setsService } from '@/lib/supabase/sets';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Play, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { SetWithFlashcards } from '@/lib/supabase/sets';

export default function SharedSetPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [set, setSet] = useState<SetWithFlashcards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSet();
  }, [shareId]);

  const loadSet = async () => {
    try {
      setIsLoading(true);
      // Note: setsService.getByShareId needs to be implemented
      // For now, we'll use a placeholder
      setError('Fonctionnalité en cours de développement');
    } catch (err: any) {
      setError(err.message || 'Failed to load set');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-background-base">
        <p className="text-white">Chargement...</p>
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-background-base">
        <Card className="p-8 text-center max-w-md">
          <BookOpen className="h-16 w-16 text-dark-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Set introuvable</h2>
          <p className="text-dark-text-secondary mb-4">
            {error || 'Ce set n\'existe pas ou n\'est plus accessible.'}
          </p>
          <Link href="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-background-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6">
          <h1 className="text-3xl font-bold text-white mb-4">{set.title}</h1>
          {set.description && (
            <p className="text-dark-text-secondary mb-6">{set.description}</p>
          )}
          
          <div className="flex gap-4">
            <Link href={`/study/${set.id}`}>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Étudier ce set
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
