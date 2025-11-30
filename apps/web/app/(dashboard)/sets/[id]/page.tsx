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
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

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
        <div className="flex gap-2">
          <Link href={`/sets/${setId}/edit`}>
            <Button size="sm" variant="outline">
              Importer
            </Button>
          </Link>
          <Link href={`/sets/${setId}/flashcards/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Flashcard
            </Button>
          </Link>
        </div>
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
            <Card key={card.id} className="relative group">
              <div className="p-4">
                <div className="mb-2">
                  <span className="text-xs text-gray-500">Front</span>
                  <p className="font-medium text-gray-900">{card.front}</p>
                </div>
                <div className="mb-4">
                  <span className="text-xs text-gray-500">Back</span>
                  <p className="text-gray-900">{card.back}</p>
                </div>
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/sets/${setId}/flashcards/${card.id}/edit`}>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!confirm('Are you sure you want to delete this flashcard?')) return;
                      setDeletingCardId(card.id);
                      try {
                        await flashcardsService.delete(card.id);
                        await loadSet();
                      } catch (error) {
                        console.error('Failed to delete flashcard:', error);
                        alert('Failed to delete flashcard');
                      } finally {
                        setDeletingCardId(null);
                      }
                    }}
                    disabled={deletingCardId === card.id}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {deletingCardId === card.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

