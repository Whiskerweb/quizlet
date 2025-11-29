'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { setsApi, Set } from '@/lib/api/sets.api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, BookOpen, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [sets, setSets] = useState<Set[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSets = async () => {
    try {
      setIsLoading(true);
      const response = await setsApi.getAll({ userId: user?.id });
      setSets(response.sets);
    } catch (error) {
      console.error('Failed to load sets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600 mt-1">Manage your study sets</p>
        </div>
        <Link href="/sets/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Set
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading your sets...</p>
        </div>
      ) : sets.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No sets yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first study set to get started
          </p>
          <Link href="/sets/create">
            <Button>Create Your First Set</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((set) => (
            <Link key={set.id} href={`/sets/${set.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{set.title}</CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                    {set.description || 'No description'}
                  </p>
                </CardHeader>
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{set._count.flashcards} cards</span>
                    <span>{set.isPublic ? 'Public' : 'Private'}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

