'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setsService } from '@/lib/supabase/sets';
import { flashcardsService } from '@/lib/supabase/flashcards';
import { sharedSetsService } from '@/lib/supabase/shared-sets';
import { classModulesService } from '@/lib/supabase/class-modules';
import type { SetWithFlashcards } from '@/lib/supabase/sets';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormattedText } from '@/components/FormattedText';
import { Play, Edit, Trash2, Plus, Share2, Check, ArrowLeft } from 'lucide-react';
import { ShareManageModal } from '@/components/ShareManageModal';
import { hashPassword } from '@/lib/supabase/shared-sets';
import { useAuthStore } from '@/store/authStore';

export default function SetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuthStore();
  const setId = params.id as string;
  const [set, setSet] = useState<SetWithFlashcards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);
  const [isInCollection, setIsInCollection] = useState(false);
  const [checkingCollection, setCheckingCollection] = useState(true);
  const [classInfo, setClassInfo] = useState<{ class_id: string; class: any } | null>(null);
  const [progress, setProgress] = useState<{ total_cards: number; mastered_cards: number; progress_percentage: number } | null>(null);

  useEffect(() => {
    loadSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  useEffect(() => {
    if (set && user && set.user_id !== user.id) {
      // Only check collection if the set doesn't belong to the current user
      checkIfInCollection();
    } else if (set && user && set.user_id === user.id) {
      // If it's the owner's set, it's not in their collection (it's their own set)
      setIsInCollection(false);
      setCheckingCollection(false);
    } else {
      setCheckingCollection(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, user]);

  // Check if set belongs to a class (for students)
  useEffect(() => {
    const checkSetClass = async () => {
      // Check if we have a classId in URL params (from "Back to Set" after study)
      const classIdFromUrl = searchParams?.get('classId');
      if (classIdFromUrl) {
        console.log('[SetDetail] Found classId in URL params:', classIdFromUrl);
        setClassInfo({ class_id: classIdFromUrl, class: { id: classIdFromUrl } });
        return;
      }

      // Only check for students
      if (set && profile?.role === 'student' && set.folder_id) {
        try {
          console.log('[SetDetail] Checking if set belongs to a class...', { setId, folderId: set.folder_id });
          const foundClass = await classModulesService.findSetClass(setId);
          if (foundClass) {
            console.log('[SetDetail] Found class for set:', foundClass);
            setClassInfo(foundClass);
          } else {
            console.log('[SetDetail] Set does not belong to any class');
          }
        } catch (error) {
          console.warn('[SetDetail] Failed to find set class:', error);
        }
      }
    };

    if (set && profile) {
      checkSetClass();
    }
  }, [set, profile, setId, searchParams]);

  // Load progress when classInfo is available
  useEffect(() => {
    const loadProgress = async () => {
      if (set && profile?.role === 'student' && classInfo) {
        try {
          const progressData = await setsService.getProgress(setId);
          setProgress(progressData);
        } catch (error) {
          console.warn('[SetDetail] Failed to load progress:', error);
        }
      }
    };

    loadProgress();
  }, [set, profile, classInfo, setId]);

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

  const checkIfInCollection = async () => {
    if (!set || !user) return;
    
    try {
      setCheckingCollection(true);
      const hasAccess = await sharedSetsService.hasAccess(setId);
      setIsInCollection(hasAccess);
    } catch (error) {
      console.error('Failed to check collection:', error);
      setIsInCollection(false);
    } finally {
      setCheckingCollection(false);
    }
  };

  const handleAddToCollection = async () => {
    if (!set) return;
    
    setIsAddingToCollection(true);
    try {
      // Check if password is required
      if (set.password_hash) {
        const password = prompt('Ce cardz est protégé par un mot de passe. Veuillez entrer le mot de passe :');
        if (!password) {
          setIsAddingToCollection(false);
          return;
        }
        await sharedSetsService.shareSet(setId, password);
      } else {
        await sharedSetsService.shareSet(setId);
      }
      setIsInCollection(true);
      // Optionally redirect to shared sets
      // router.push('/folders/shared');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'ajout du cardz à votre collection');
    } finally {
      setIsAddingToCollection(false);
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

  const handleSaveSubject = async (subject: string | null) => {
    await setsService.update(setId, { subject });
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

  // Check if the set belongs to the current user
  const isOwner = user && set.user_id === user.id;

  return (
    <>
      <div className="mb-6">
        {/* Back button if set belongs to a class */}
        {classInfo && (
          <Link 
            href={`/my-class/${classInfo.class_id}`}
            className="mb-4 inline-flex items-center gap-2 text-[14px] text-content-muted hover:text-content-emphasis transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la classe
          </Link>
        )}

        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-[28px] font-bold text-content-emphasis">{set.title}</h1>
            {set.description && (
              <p className="text-[16px] text-content-muted mt-2">{set.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Link href={`/study/${setId}`}>
              <Button>
                <Play className="h-4 w-4" />
                Étudier
              </Button>
            </Link>
            {isOwner ? (
              <>
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
              </>
            ) : (
              <>
                {checkingCollection ? (
                  <Button variant="outline" disabled>
                    Vérification...
                  </Button>
                ) : isInCollection ? (
                  <Button variant="outline" disabled className="bg-green-500/20 border-green-500 text-green-500">
                    <Check className="h-4 w-4 mr-2" />
                    Dans votre collection
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleAddToCollection}
                    disabled={isAddingToCollection}
                    className="border-brand-primary bg-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-content-inverted"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isAddingToCollection ? 'Ajout...' : 'Ajouter à ma collection'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex space-x-4 text-[13px] text-content-muted">
          <span>{set.flashcards?.length || 0} cards</span>
          <span>{set.is_public ? 'Public' : 'Private'}</span>
          {set.language && <span>Language: {set.language}</span>}
        </div>

        {/* Progress bar for class sets */}
        {classInfo && progress && progress.total_cards > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] text-content-muted">Progression</span>
              <span className="text-[13px] font-medium text-content-emphasis">
                {progress.progress_percentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-bg-subtle rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progress.progress_percentage === 100
                    ? 'bg-green-500'
                    : 'bg-brand-primary'
                }`}
                style={{ width: `${progress.progress_percentage}%` }}
              />
            </div>
            <p className="text-[12px] text-content-subtle mt-1">
              {progress.mastered_cards} / {progress.total_cards} cartes maîtrisées
            </p>
          </div>
        )}
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-[20px] font-semibold text-content-emphasis">Cardz</h2>
        {isOwner && (
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
        )}
      </div>

      {set.flashcards.length === 0 ? (
        <Card variant="emptyState" className="py-12 text-center">
          <p className="text-[15px] text-content-muted mb-4">No cardz yet</p>
          {isOwner && (
            <Link href={`/sets/${setId}/flashcards/new`}>
              <Button>Add Your First Card</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {set.flashcards.map((card, index) => (
            <Card key={card.id} className="relative group">
              <div className="absolute right-4 top-4 rounded-full border border-border-subtle px-2 py-0.5 text-[11px] font-medium text-content-muted">
                {index + 1}/{set.flashcards.length}
              </div>
              <div className="p-4 card-text-content">
                <div className="mb-2">
                  <span className="text-[14px] text-content-muted">Front</span>
                  <FormattedText text={card.front} className="mt-1 text-[15px] text-content-emphasis" as="p" />
                </div>
                <div className="mb-4">
                  <span className="text-[14px] text-content-muted">Back</span>
                  <FormattedText text={card.back} className="mt-1 text-[15px] text-content-emphasis" as="p" />
                </div>
                {isOwner && (
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
                      className="text-state-danger border-state-danger hover:bg-bg-subtle"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingCardId === card.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {set && isOwner && (
        <ShareManageModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onSave={handleSavePassword}
          onSaveSubject={handleSaveSubject}
          currentPassword={set.password_hash || null}
          currentSubject={set.subject || null}
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

