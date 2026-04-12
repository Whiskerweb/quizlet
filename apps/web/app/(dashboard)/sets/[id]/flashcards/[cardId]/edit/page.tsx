'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { flashcardsService } from '@/lib/supabase/flashcards';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/RichTextEditor';

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
    setValue,
    watch,
  } = useForm<EditFlashcardFormData>({
    resolver: zodResolver(editFlashcardSchema),
  });

  const frontValue = watch('front');
  const backValue = watch('back');

  useEffect(() => {
    loadFlashcard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  const loadFlashcard = async () => {
    try {
      setIsLoading(true);
      const flashcard = await flashcardsService.getOne(cardId);
      // Convert HTML tags to proper format if needed
      const front = flashcard.front || '';
      const back = flashcard.back || '';
      reset({
        front: front,
        back: back,
        imageUrl: flashcard.image_url || '',
        audioUrl: flashcard.audio_url || '',
      });
    } catch (err: any) {
      setError('Failed to load cardz');
      console.error('Failed to load cardz:', err);
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
      setError(err.message || 'Failed to update cardz');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this cardz?')) return;

    try {
      await flashcardsService.delete(cardId);
      router.push(`/sets/${setId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete cardz');
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
    <>
      <h1 className="text-[28px] font-bold text-content-emphasis mb-6">Edit Cardz</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Cardz Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          {error && (
            <div className="bg-bg-subtle border border-state-danger text-state-danger px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="front" className="block text-[14px] font-medium text-content-subtle mb-1">
              Front (Question) *
            </label>
            <input
              type="hidden"
              {...register('front')}
            />
            <RichTextEditor
              id="front"
              value={frontValue || ''}
              onChange={(value) => setValue('front', value, { shouldDirty: true })}
              placeholder="Enter the question or term..."
              rows={4}
            />
            {errors.front && (
              <p className="mt-1 text-[13px] text-state-danger">{errors.front.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="back" className="block text-[14px] font-medium text-content-subtle mb-1">
              Back (Answer) *
            </label>
            <input
              type="hidden"
              {...register('back')}
            />
            <RichTextEditor
              id="back"
              value={backValue || ''}
              onChange={(value) => setValue('back', value, { shouldDirty: true })}
              placeholder="Enter the answer or definition..."
              rows={4}
            />
            {errors.back && (
              <p className="mt-1 text-[13px] text-state-danger">{errors.back.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-[14px] font-medium text-content-subtle mb-1">
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
            <label htmlFor="audioUrl" className="block text-[14px] font-medium text-content-subtle mb-1">
              Audio URL (optional)
            </label>
            <Input
              id="audioUrl"
              type="url"
              {...register('audioUrl')}
              placeholder="https://example.com/audio.mp3"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              className="text-state-danger border-state-danger hover:bg-bg-subtle"
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
    </>
  );
}


