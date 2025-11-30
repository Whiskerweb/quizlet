'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sharedSetsService } from '@/lib/supabase/shared-sets';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Share2, Play, Trash2, User } from 'lucide-react';
import type { SharedSetWithDetails } from '@/lib/supabase/shared-sets';

// Re-export the type for convenience
type SharedSet = SharedSetWithDetails;

export default function SharedSetsFolderPage() {
  const router = useRouter();
  const [sharedSets, setSharedSets] = useState<SharedSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSharedSets();
  }, []);

  const loadSharedSets = async () => {
    try {
      setIsLoading(true);
      const data = await sharedSetsService.getMySharedSets();
      setSharedSets(data);
    } catch (error) {
      console.error('Failed to load shared sets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSharedSet = async (sharedSetId: string) => {
    if (!confirm('Voulez-vous retirer ce set de votre liste ?')) return;

    try {
      await sharedSetsService.removeSharedSet(sharedSetId);
      await loadSharedSets();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  if (isLoading) {
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
            <Share2 className="h-6 w-6" style={{ color: '#8B8FBE' }} />
            <div>
              <h1 className="text-[28px] font-bold text-white">Sets partagés</h1>
              <p className="text-[16px] text-dark-text-secondary">
                {sharedSets.length} {sharedSets.length === 1 ? 'set' : 'sets'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {sharedSets.length === 0 ? (
        <Card variant="emptyState" className="text-center py-12">
          <Share2 className="h-12 w-12 text-dark-text-muted mx-auto mb-4" />
          <h3 className="text-[16px] text-white mb-2">Aucun set partagé</h3>
          <p className="text-[16px] text-white mb-4">
            Les sets que vous ajoutez depuis les profils d'autres utilisateurs apparaîtront ici
          </p>
          <Link href="/dashboard">
            <Button>Retour au dashboard</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sharedSets.map((sharedSet) => (
            <Card key={sharedSet.id} className="h-full hover:shadow-elevation-1 transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{sharedSet.set.title}</CardTitle>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-dark-text-muted mb-2">
                  <User className="h-3 w-3" />
                  <span>Par {sharedSet.set.profiles?.username || 'Unknown'}</span>
                </div>
                <p className="text-[16px] text-white line-clamp-2 mt-2">
                  {sharedSet.set.description || 'No description'}
                </p>
              </CardHeader>
              <div className="px-6 pb-6 space-y-3">
                <div className="flex items-center justify-between text-[13px] text-dark-text-muted">
                  <span>Set partagé</span>
                  {sharedSet.set.password_hash && (
                    <span className="text-brand-primary">Protégé</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/study/${sharedSet.set.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      Étudier
                    </Button>
                  </Link>
                  <Link href={`/sets/${sharedSet.set.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      Voir
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => handleRemoveSharedSet(sharedSet.id)}
                    size="sm"
                    className="text-dark-states-danger border-dark-states-danger hover:bg-dark-background-cardMuted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

