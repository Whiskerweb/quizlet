'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { setsService } from '@/lib/supabase/sets';
import { flashcardsService } from '@/lib/supabase/flashcards';
import type { SetWithFlashcards } from '@/lib/supabase/sets';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Play, Edit, Trash2, Plus } from 'lucide-react';

export default function SetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.id as string;
  const [set, setSet] = useState<SetWithFlashcards | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const loadSet = async () => {
    try {
      setIsLoading(true);
      const data = await setsService.getOne(setId);
      setSet(data);
    } catch (error) {
      console.error('Failed to load set:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this set?')) return;

    try {
      await setsService.delete(setId);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete set:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>Set not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{set.title}</h1>
            {set.description && (
              <p className="text-gray-600 mt-2">{set.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Link href={`/study/${setId}`}>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Study
              </Button>
            </Link>
            <Link href={`/sets/${setId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="flex space-x-4 text-sm text-gray-600">
          <span>{set.flashcards?.length || 0} cards</span>
          <span>{set.is_public ? 'Public' : 'Private'}</span>
          {set.language && <span>Language: {set.language}</span>}
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Flashcards</h2>
        <Link href={`/sets/${setId}/flashcards/new`}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Flashcard
          </Button>
        </Link>
      </div>

      {set.flashcards.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600 mb-4">No flashcards yet</p>
          <Link href={`/sets/${setId}/flashcards/new`}>
            <Button>Add Your First Card</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {set.flashcards.map((card, index) => (
            <Card key={card.id}>
              <div className="p-4">
                <div className="mb-2">
                  <span className="text-xs text-gray-500">Front</span>
                  <p className="font-medium">{card.front}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Back</span>
                  <p className="text-gray-700">{card.back}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

