'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { setsService } from '@/lib/supabase/sets';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

const createSetSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.string().optional(),
  language: z.string().optional(),
});

type CreateSetFormData = z.infer<typeof createSetSchema>;

export default function CreateSetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSetFormData>({
    resolver: zodResolver(createSetSchema),
  });

  const onSubmit = async (data: CreateSetFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const tags = data.tags ? data.tags.split(',').map((t) => t.trim()) : [];
      const set = await setsService.create({
        title: data.title,
        description: data.description || null,
        is_public: data.isPublic ?? false,
        tags,
        language: data.language || null,
      });
      // Rediriger vers le dashboard après création
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create set');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-semibold text-content-emphasis">Create New Set</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Set Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-content-emphasis">
              Title *
            </label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., French Vocabulary"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-content-emphasis">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary text-gray-900 bg-white"
              placeholder="Describe your set..."
            />
          </div>

          <div>
            <label htmlFor="tags" className="mb-1 block text-sm font-medium text-content-emphasis">
              Tags (comma-separated)
            </label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="french, vocabulary, language"
            />
          </div>

          <div>
            <label htmlFor="language" className="mb-1 block text-sm font-medium text-content-emphasis">
              Language
            </label>
            <Input
              id="language"
              {...register('language')}
              placeholder="e.g., French, English"
            />
          </div>

          <div className="flex items-center">
            <input
              id="isPublic"
              type="checkbox"
              {...register('isPublic')}
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-content-emphasis">
              Make this set public
            </label>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Set'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


