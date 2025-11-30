'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { flashcardsService } from '@/lib/supabase/flashcards';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

const editFlashcardSchema = z.object({
  front: z.string().min(1, 'Front is required'),
  back: z.string().min(1, 'Back is required'),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
});

type EditFlashcardFormData = z.infer<typeof editFlashcardSchema>;

export default function EditFlashcardPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.id as string;
  const cardId = params.cardId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditFlashcardFormData>({
    resolver: zodResolver(editFlashcardSchema),
  });

  useEffect(() => {
    loadFlashcard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  const loadFlashcard = async () => {
    try {
      setIsLoading(true);
      const flashcard = await flashcardsService.getOne(cardId);
      reset({
        front: flashcard.front,
        back: flashcard.back,
        imageUrl: flashcard.image_url || '',
        audioUrl: flashcard.audio_url || '',
      });
    } catch (err: any) {
      setError('Failed to load flashcard');
      console.error('Failed to load flashcard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EditFlashcardFormData) => {
    setIsSaving(true);
    setError(null);

    try {
      await flashcardsService.update(cardId, {
        front: data.front,
        back: data.back,
        image_url: data.imageUrl || null,
        audio_url: data.audioUrl || null,
      });
      router.push(`/sets/${setId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update flashcard');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;

    try {
      await flashcardsService.delete(cardId);
      router.push(`/sets/${setId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete flashcard');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Flashcard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Flashcard Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="front" className="block text-sm font-medium text-gray-700 mb-1">
              Front (Question) *
            </label>
            <textarea
              id="front"
              {...register('front')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              placeholder="Enter the question or term..."
            />
            {errors.front && (
              <p className="mt-1 text-sm text-red-600">{errors.front.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="back" className="block text-sm font-medium text-gray-700 mb-1">
              Back (Answer) *
            </label>
            <textarea
              id="back"
              {...register('back')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              placeholder="Enter the answer or definition..."
            />
            {errors.back && (
              <p className="mt-1 text-sm text-red-600">{errors.back.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL (optional)
            </label>
            <input
              id="imageUrl"
              type="url"
              {...register('imageUrl')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Audio URL (optional)
            </label>
            <input
              id="audioUrl"
              type="url"
              {...register('audioUrl')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              placeholder="https://example.com/audio.mp3"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Delete
            </Button>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

