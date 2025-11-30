'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { setsApi, Set } from '@/lib/api/sets.api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [sets, setSets] = useState<Set[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const loadSets = async () => {
    try {
      setIsLoading(true);
      // Note: In a real app, you'd fetch user profile first, then their sets
      const response = await setsApi.getAll({ userId: username });
      setSets(response.sets);
    } catch (error) {
      console.error('Failed to load sets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{username}</h1>
            <p className="text-gray-600">{sets.length} sets</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : sets.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[16px] text-white">No sets yet</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((set) => (
            <Card key={set.id} className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="line-clamp-2">{set.title}</CardTitle>
                <p className="text-[16px] text-white line-clamp-2 mt-2">
                  {set.description || 'No description'}
                </p>
              </CardHeader>
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between text-[16px] text-white">
                  <span>{set._count.flashcards} cards</span>
                  <span>{set.isPublic ? 'Public' : 'Private'}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

