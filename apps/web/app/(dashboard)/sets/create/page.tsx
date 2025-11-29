'use client';

export const dynamic = 'force-dynamic';

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
      router.push(`/sets/${set.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create set');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Set</h1>

      <Card>
        <CardHeader>
          <CardTitle>Set Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe your set..."
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="french, vocabulary, language"
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
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


