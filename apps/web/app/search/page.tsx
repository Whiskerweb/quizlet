'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { searchApi } from '@/lib/api/search.api';
import { Set } from '@/lib/api/sets.api';
import { Search as SearchIcon } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [sets, setSets] = useState<Set[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await searchApi.search({ q: query });
      setSets(response.sets);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Sets</h1>

        <div className="mb-8">
          <div className="flex space-x-2">
            <Input
              placeholder="Search for sets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Searching...</p>
          </div>
        ) : hasSearched && sets.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600">No sets found</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((set) => (
              <Link key={set.id} href={`/s/${set.shareId}`}>
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
                      <span>by {set.user.username}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


