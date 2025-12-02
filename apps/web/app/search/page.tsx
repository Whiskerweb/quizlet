'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-dark-background-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Rechercher des sets</h1>
          <p className="text-dark-text-secondary">Trouvez des sets publics de flashcards</p>
        </div>

        <Card className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des sets..."
                className="w-full pl-12 pr-4 py-3 bg-dark-background-base border border-[rgba(255,255,255,0.12)] rounded-lg text-white placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <Button>Rechercher</Button>
          </div>

          <div className="text-center py-12">
            <p className="text-dark-text-secondary">Page de recherche en construction</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
