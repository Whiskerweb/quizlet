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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-[24px] sm:text-[28px] lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
          Search Sets
        </h1>

        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Input
              placeholder="Search for sets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-10 sm:h-11 text-[14px] sm:text-[15px]"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="w-full sm:w-auto h-10 sm:h-11 text-[14px] sm:text-[15px] px-4 sm:px-6"
            >
              <SearchIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-gray-600 text-[14px] sm:text-[15px]">Searching...</p>
          </div>
        ) : hasSearched && sets.length === 0 ? (
          <Card className="text-center py-12 sm:py-16 border border-gray-200">
            <p className="text-gray-600 text-[14px] sm:text-[15px]">No sets found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {sets.map((set) => (
              <Link key={set.id} href={`/s/${set.shareId}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border border-gray-200">
                  <CardHeader className="px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-3 sm:pb-4">
                    <CardTitle className="line-clamp-2 text-[15px] sm:text-[16px] mb-2">
                      {set.title}
                    </CardTitle>
                    <p className="text-[13px] sm:text-sm text-gray-600 line-clamp-2">
                      {set.description || 'No description'}
                    </p>
                  </CardHeader>
                  <div className="px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6">
                    <div className="flex items-center justify-between text-[12px] sm:text-sm text-gray-500">
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





