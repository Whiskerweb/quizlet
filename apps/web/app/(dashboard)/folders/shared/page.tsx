'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sharedSetsService } from '@/lib/supabase/shared-sets';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Share2, Play, Trash2, User, Shield, Eye, Layers } from 'lucide-react';
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
        <p className="text-content-muted">Chargement...</p>
      </div>
    );
  }

  const renderActions = (sharedSet: SharedSet) => (
    <div className="flex items-center gap-2">
      <Link
        href={`/study/${sharedSet.set.id}`}
        aria-label="Étudier"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-content-muted transition hover:text-content-emphasis"
      >
        <Play className="h-4 w-4" />
      </Link>
      <Link
        href={`/sets/${sharedSet.set.id}`}
        aria-label="Voir le set"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-content-muted transition hover:text-content-emphasis"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <button
        aria-label="Retirer de ma collection"
        onClick={() => handleRemoveSharedSet(sharedSet.id)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-content-muted transition hover:text-state-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="rounded-3xl border border-border-subtle bg-bg-emphasis/90 px-5 py-3 shadow-panel">
          <p className="text-[12px] uppercase tracking-[0.2em] text-content-subtle">Bibliothèque partagée</p>
          <h1 className="text-[26px] font-semibold text-content-emphasis">Cardz partagés</h1>
          <p className="text-[14px] text-content-muted">{sharedSets.length} cardz ajoutés à votre collection</p>
        </div>
      </div>

      {sharedSets.length === 0 ? (
        <Card variant="emptyState" className="py-12 text-center">
          <Share2 className="h-12 w-12 text-content-subtle mx-auto mb-4" />
          <h3 className="text-[16px] text-content-emphasis mb-2">Aucun set partagé</h3>
          <p className="text-[15px] text-content-muted mb-4">
            Les Cardz que vous ajoutez depuis les profils d'autres utilisateurs apparaîtront ici
          </p>
          <Link href="/dashboard">
            <Button>Retour au dashboard</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sharedSets.map((sharedSet) => (
            <div
              key={sharedSet.id}
              className="rounded-2xl border border-border-subtle bg-bg-emphasis/95 p-4 transition hover:border-border-emphasis hover:shadow-card"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-content-emphasis line-clamp-2">
                      {sharedSet.set.title}
                    </p>
                    <p className="text-[12px] text-content-muted">
                      Par {sharedSet.set.profiles?.username || 'Unknown'}
                    </p>
                  </div>
                  {sharedSet.set.password_hash && (
                    <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[11px] text-content-muted">
                      Protégé
                    </span>
                  )}
                </div>

                <p className="text-[13px] text-content-muted line-clamp-3">
                  {sharedSet.set.description || 'Aucune description'}
                </p>

                <div className="flex items-center justify-between text-[12px] text-content-muted">
                  <span>Ajouté le {new Date(sharedSet.added_at ?? sharedSet.created_at).toLocaleDateString('fr-FR')}</span>
                  {renderActions(sharedSet)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

