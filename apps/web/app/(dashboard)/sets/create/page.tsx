'use client';

import { useRouter } from 'next/navigation';
import { createSetAndRedirect } from '@/lib/utils/createSetAndRedirect';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BookOpen } from 'lucide-react';

export default function CreateSetPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSet = async () => {
    setIsCreating(true);
    try {
      const setId = await createSetAndRedirect();
      router.push(`/sets/${setId}/edit`);
    } catch (error) {
      console.error('Failed to create set:', error);
      alert('Failed to create set. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8">
        <div className="text-center mb-8">
          <BookOpen className="h-16 w-16 text-brand-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Créer un nouveau set</h1>
          <p className="text-dark-text-secondary">
            Commencez par créer un set de flashcards pour organiser votre apprentissage
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleCreateSet}
            disabled={isCreating}
            className="w-full"
            size="lg"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            {isCreating ? 'Création...' : 'Créer un nouveau set'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
