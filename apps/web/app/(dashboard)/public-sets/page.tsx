'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setsService } from '@/lib/supabase/sets';
import { sharedSetsService } from '@/lib/supabase/shared-sets';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Globe, Play, Plus, User, Filter, X } from 'lucide-react';
import type { SetWithFlashcards } from '@/lib/supabase/sets';
import { SUBJECTS, getSubjectLabel } from '@/lib/constants/subjects';

export default function PublicSetsPage() {
  const router = useRouter();
  const [publicSets, setPublicSets] = useState<SetWithFlashcards[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isAddingSet, setIsAddingSet] = useState<string | null>(null);

  const limit = 20;

  const loadPublicSets = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await setsService.getPublicSetsWithoutPassword({
        search: searchQuery || undefined,
        subject: selectedSubject || undefined,
        page: currentPage,
        limit,
      });
      setPublicSets(result.sets);
      setTotalCount(result.pagination.total);
    } catch (error) {
      console.error('Failed to load public sets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, selectedSubject]);

  useEffect(() => {
    loadPublicSets();
  }, [loadPublicSets]);

  const handleAddSet = async (setId: string) => {
    setIsAddingSet(setId);
    try {
      await sharedSetsService.shareSet(setId);
      // Reload to update the UI if needed
      await loadPublicSets();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'ajout du set');
    } finally {
      setIsAddingSet(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPublicSets();
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedSubject('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);
  const hasActiveFilters = selectedSubject || searchQuery;

  if (isLoading && publicSets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-white">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6" style={{ color: '#8B8FBE' }} />
            <div>
              <h1 className="text-[28px] font-bold text-white">Cardz publique</h1>
              <p className="text-[16px] text-dark-text-secondary">
                {totalCount} {totalCount === 1 ? 'Cardz' : 'Cardz'} disponible{totalCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des cardz..."
            className="flex-1 px-4 py-2 bg-dark-background-card border border-[rgba(255,255,255,0.12)] rounded-lg text-white placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilter(!showFilter)}
            className={showFilter ? 'bg-brand-primary border-brand-primary text-white' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button type="submit" variant="outline">
            Rechercher
          </Button>
        </form>

        {/* Filter Panel */}
        {showFilter && (
          <div className="p-4 bg-dark-background-cardMuted rounded-lg border border-[rgba(255,255,255,0.12)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-white">Filtrer par catégorie</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-dark-text-secondary hover:text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-4 py-2 bg-dark-background-base border border-[rgba(255,255,255,0.12)] rounded-lg text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">Toutes les catégories</option>
              {SUBJECTS.map((subj) => (
                <option key={subj.value} value={subj.value}>
                  {subj.label}
                </option>
              ))}
            </select>
            {selectedSubject && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[12px] text-dark-text-secondary">Filtre actif :</span>
                <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-[12px] font-medium">
                  {getSubjectLabel(selectedSubject)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && !showFilter && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-dark-text-secondary">Filtres actifs :</span>
            {selectedSubject && (
              <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-[12px] font-medium flex items-center gap-2">
                {getSubjectLabel(selectedSubject)}
                <button
                  onClick={() => handleSubjectChange('')}
                  className="hover:text-brand-primary/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-[12px] font-medium flex items-center gap-2">
                Recherche: "{searchQuery}"
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="hover:text-brand-primary/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {publicSets.length === 0 ? (
        <Card variant="emptyState" className="text-center py-12">
          <Globe className="h-12 w-12 text-dark-text-muted mx-auto mb-4" />
          <h3 className="text-[16px] text-white mb-2">Aucun cardz public trouvé</h3>
          <p className="text-[16px] text-white mb-4">
            {searchQuery
              ? 'Aucun résultat pour votre recherche. Essayez avec d\'autres mots-clés.'
              : 'Il n\'y a pas encore de cardz publics sans mot de passe.'}
          </p>
          {searchQuery && (
            <Button onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
              Réinitialiser la recherche
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicSets.map((set) => (
              <Card key={set.id} className="h-full hover:shadow-elevation-1 transition-shadow card-text-content">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2">{set.title}</CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-dark-text-muted mb-2">
                    <User className="h-3 w-3" />
                    <span>Par {(set.profiles || set.user)?.username || 'Unknown'}</span>
                  </div>
                  <p className="text-[16px] text-white line-clamp-2 mt-2">
                    {set.description || 'No description'}
                  </p>
                </CardHeader>
                <div className="px-6 pb-6 space-y-3">
                  <div className="flex items-center justify-between text-[13px] text-dark-text-muted">
                    <div className="flex items-center gap-2">
                      <span>Public</span>
                      {set.subject && (
                        <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded text-[11px] font-medium">
                          {getSubjectLabel(set.subject)}
                        </span>
                      )}
                    </div>
                    {set.tags && set.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {set.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-dark-background-cardMuted rounded text-[11px]"
                          >
                            {tag}
                          </span>
                        ))}
                        {set.tags.length > 2 && (
                          <span className="text-[11px]">+{set.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/study/${set.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Étudier
                      </Button>
                    </Link>
                    <Link href={`/sets/${set.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        Voir
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => handleAddSet(set.id)}
                      disabled={isAddingSet === set.id}
                      size="sm"
                      className="text-brand-primary border-brand-primary hover:bg-brand-primary hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                size="sm"
              >
                Précédent
              </Button>
              <span className="text-dark-text-secondary text-sm">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                size="sm"
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}

