'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { flashcardsService } from '@/lib/supabase/flashcards';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

const createFlashcardSchema = z.object({
  front: z.string().min(1, 'Front is required'),
  back: z.string().min(1, 'Back is required'),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
});

type CreateFlashcardFormData = z.infer<typeof createFlashcardSchema>;

export default function NewFlashcardPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFlashcardFormData>({
    resolver: zodResolver(createFlashcardSchema),
  });

  const onSubmit = async (data: CreateFlashcardFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await flashcardsService.create(setId, {
        front: data.front,
        back: data.back,
        image_url: data.imageUrl || null,
        audio_url: data.audioUrl || null,
      });
      router.push(`/sets/${setId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create flashcard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Flashcard</h1>

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <Input
              id="imageUrl"
              type="url"
              {...register('imageUrl')}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Audio URL (optional)
            </label>
            <Input
              id="audioUrl"
              type="url"
              {...register('audioUrl')}
              placeholder="https://example.com/audio.mp3"
            />
          </div>

          <div className="flex space-x-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Flashcard'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/sets/${setId}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


