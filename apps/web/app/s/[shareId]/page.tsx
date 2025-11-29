'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { setsApi, Set } from '@/lib/api/sets.api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Play, User } from 'lucide-react';

export default function SharedSetPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [set, setSet] = useState<(Set & { flashcards: any[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  const loadSet = async () => {
    try {
      setIsLoading(true);
      const data = await setsApi.getByShareId(shareId);
      setSet(data);
    } catch (error) {
      console.error('Failed to load set:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>Set not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{set.title}</h1>
          {set.description && (
            <p className="text-gray-600 mb-4">{set.description}</p>
          )}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-1" />
              {set.user.username}
            </div>
            <span className="text-sm text-gray-600">{set._count.flashcards} cards</span>
            {set.language && (
              <span className="text-sm text-gray-600">Language: {set.language}</span>
            )}
          </div>
          <Link href={`/study/${set.id}`}>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Study This Set
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {set.flashcards.map((card) => (
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
      </div>
    </div>
  );
}

