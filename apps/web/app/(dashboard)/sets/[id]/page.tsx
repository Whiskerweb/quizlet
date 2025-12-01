'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { setsService } from '@/lib/supabase/sets';
import { flashcardsService } from '@/lib/supabase/flashcards';
import type { SetWithFlashcards } from '@/lib/supabase/sets';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormattedText } from '@/components/FormattedText';
import { Play, Edit, Trash2, Plus, Share2 } from 'lucide-react';
import { ShareManageModal } from '@/components/ShareManageModal';
import { hashPassword } from '@/lib/supabase/shared-sets';

export default function SetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.id as string;
  const [set, setSet] = useState<SetWithFlashcards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    loadSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const loadSet = async () => {
    try {
      setIsLoading(true);
      const data = await setsService.getOne(setId);
      setSet(data);
    } catch (error) {
      console.error('Failed to load set:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this set?')) return;

    try {
      await setsService.delete(setId);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete set:', error);
    }
  };

  const handleSavePassword = async (password: string | null) => {
    const passwordHash = password ? hashPassword(password) : null;
    await setsService.update(setId, { password_hash: passwordHash });
    await loadSet();
  };

  const handleSetPublic = async (isPublic: boolean) => {
    await setsService.update(setId, { is_public: isPublic });
    await loadSet();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>Set not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-[28px] font-bold text-dark-text-primary">{set.title}</h1>
            {set.description && (
              <p className="text-[16px] text-dark-text-secondary mt-2">{set.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Link href={`/study/${setId}`}>
              <Button>
                <Play className="h-4 w-4" />
                Study
              </Button>
            </Link>
            <Link href={`/sets/${setId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setIsShareModalOpen(true)}>
              <Share2 className="h-4 w-4" />
              Partager
            </Button>
            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="flex space-x-4 text-[13px] text-dark-text-secondary">
          <span>{set.flashcards?.length || 0} cards</span>
          <span>{set.is_public ? 'Public' : 'Private'}</span>
          {set.language && <span>Language: {set.language}</span>}
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-[20px] font-semibold text-dark-text-primary">Cardz</h2>
        <div className="flex gap-2">
          <Link href={`/sets/${setId}/edit`}>
            <Button size="sm" variant="outline">
              Importer
            </Button>
          </Link>
          <Link href={`/sets/${setId}/flashcards/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Flashcard
            </Button>
          </Link>
        </div>
      </div>

      {set.flashcards.length === 0 ? (
        <Card variant="emptyState" className="text-center py-12">
          <p className="text-[16px] text-white mb-4">No cardz yet</p>
          <Link href={`/sets/${setId}/flashcards/new`}>
            <Button>Add Your First Card</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {set.flashcards.map((card, index) => (
            <Card key={card.id} className="relative group">
              <div className="p-4 card-text-content">
                <div className="mb-2">
                  <span className="text-[16px] text-white">Front</span>
                  <FormattedText text={card.front} className="text-[16px] text-white mt-1" as="p" />
                </div>
                <div className="mb-4">
                  <span className="text-[16px] text-white">Back</span>
                  <FormattedText text={card.back} className="text-[16px] text-white mt-1" as="p" />
                </div>
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/sets/${setId}/flashcards/${card.id}/edit`}>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!confirm('Are you sure you want to delete this flashcard?')) return;
                      setDeletingCardId(card.id);
                      try {
                        await flashcardsService.delete(card.id);
                        await loadSet();
                      } catch (error) {
                        console.error('Failed to delete cardz:', error);
                        alert('Failed to delete cardz');
                      } finally {
                        setDeletingCardId(null);
                      }
                    }}
                    disabled={deletingCardId === card.id}
                    className="text-dark-states-danger border-dark-states-danger hover:bg-dark-background-cardMuted"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingCardId === card.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {set && (
        <ShareManageModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onSave={handleSavePassword}
          currentPassword={set.password_hash || null}
          setIsPublic={handleSetPublic}
          currentIsPublic={set.is_public || false}
          shareId={set.share_id}
          setTitle={set.title}
          setId={set.id}
        />
      )}
    </>
  );
}

