'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { setsService } from '@/lib/supabase/sets';
import { sharedSetsService } from '@/lib/supabase/shared-sets';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormattedText } from '@/components/FormattedText';
import { PasswordPromptModal } from '@/components/PasswordPromptModal';
import { Play, User, Lock, Share2, LogIn, Check } from 'lucide-react';
import type { SetWithFlashcards } from '@/lib/supabase/sets';

export default function SharedSetPage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.shareId as string;
  const { user } = useAuthStore();
  const [set, setSet] = useState<SetWithFlashcards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyAdded, setIsAlreadyAdded] = useState(false);

  useEffect(() => {
    loadSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId, user]);

  const loadSet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await setsService.getByShareId(shareId);
      
      // Check if set is public
      if (!data.is_public) {
        setError('Ce set n\'est pas public');
        return;
      }

      // Always set the set data first
      setSet(data);

      // Check if password is required
      if (data.password_hash) {
        // Check if user already has access
        if (user) {
          const hasAccess = await sharedSetsService.hasAccess(data.id);
          if (hasAccess) {
            setPasswordVerified(true);
            setIsAlreadyAdded(true);
            return;
          }
        }
        // Password required - show modal
        setPasswordModalOpen(true);
        return;
      }

      // No password required - check if already added
      if (user) {
        const hasAccess = await sharedSetsService.hasAccess(data.id);
        setIsAlreadyAdded(hasAccess);
      }
    } catch (err: any) {
      console.error('Failed to load set:', err);
      setError(err.message || 'Set non trouvé');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    try {
      if (!set) {
        throw new Error('Set non trouvé');
      }

      // Verify password
      const { verifyPassword } = await import('@/lib/supabase/shared-sets');
      if (!verifyPassword(password, set.password_hash!)) {
        throw new Error('Mot de passe incorrect');
      }

      // If user is logged in, add to shared sets
      if (user) {
        await sharedSetsService.shareSet(set.id, password);
        setIsAlreadyAdded(true);
      }

      setPasswordVerified(true);
      setPasswordModalOpen(false);
    } catch (err: any) {
      throw err; // Let modal handle error
    }
  };

  const handleAddToMySets = async () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/s/${shareId}`);
      return;
    }

    if (!set) return;

    try {
      // Check if already added
      if (isAlreadyAdded) {
        router.push('/dashboard');
        return;
      }

      if (set.password_hash && !passwordVerified) {
        setPasswordModalOpen(true);
        return;
      }

      await sharedSetsService.shareSet(set.id);
      setIsAlreadyAdded(true);
      // Show success message but stay on page
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'ajout du set');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-background-base flex items-center justify-center">
        <p className="text-white">Chargement...</p>
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className="min-h-screen bg-dark-background-base flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-[16px] text-white">{error || 'Set non trouvé'}</p>
          <Link href="/">
            <Button className="mt-4">Retour à l'accueil</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // If password required and not verified, show nothing (modal will show)
  // But we still show the set info if it's loaded
  if (set.password_hash && !passwordVerified && !passwordModalOpen) {
    // Show the set but with password prompt
    return (
      <>
        <div className="min-h-screen bg-dark-background-base">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-[28px] font-bold text-white mb-2">{set.title}</h1>
              {set.description && (
                <p className="text-[16px] text-dark-text-secondary mb-4">{set.description}</p>
              )}
              <div className="flex items-center space-x-4 mb-4">
                {set.user && (
                  <div className="flex items-center text-[14px] text-dark-text-secondary">
                    <User className="h-4 w-4 mr-1" />
                    {set.user.username}
                  </div>
                )}
                <span className="text-[14px] text-dark-text-secondary">
                  {set.flashcards?.length || 0} {set.flashcards?.length === 1 ? 'carte' : 'cartes'}
                </span>
                {set.language && (
                  <span className="text-[14px] text-dark-text-secondary">Langue: {set.language}</span>
                )}
                {set.password_hash && (
                  <div className="flex items-center text-[14px] text-brand-primary">
                    <Lock className="h-4 w-4 mr-1" />
                    Protégé
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {user ? (
                  <Button variant="outline" onClick={() => setPasswordModalOpen(true)}>
                    <Lock className="h-4 w-4 mr-2" />
                    Entrer le mot de passe pour ajouter
                  </Button>
                ) : (
                  <Link href={`/login?redirect=/s/${shareId}`}>
                    <Button variant="outline">
                      <LogIn className="h-4 w-4 mr-2" />
                      Se connecter pour ajouter
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        <PasswordPromptModal
          isOpen={passwordModalOpen}
          onClose={() => {
            setPasswordModalOpen(false);
          }}
          onSubmit={handlePasswordSubmit}
          setTitle={set.title}
        />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-dark-background-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-white mb-2">{set.title}</h1>
            {set.description && (
              <p className="text-[16px] text-dark-text-secondary mb-4">{set.description}</p>
            )}
            <div className="flex items-center space-x-4 mb-4">
              {set.user && (
                <div className="flex items-center text-[14px] text-dark-text-secondary">
                  <User className="h-4 w-4 mr-1" />
                  {set.user.username}
                </div>
              )}
              <span className="text-[14px] text-dark-text-secondary">
                {set.flashcards?.length || 0} {set.flashcards?.length === 1 ? 'carte' : 'cartes'}
              </span>
              {set.language && (
                <span className="text-[14px] text-dark-text-secondary">Langue: {set.language}</span>
              )}
              {set.password_hash && (
                <div className="flex items-center text-[14px] text-brand-primary">
                  <Lock className="h-4 w-4 mr-1" />
                  Protégé
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/study/${set.id}`}>
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Étudier ce set
                </Button>
              </Link>
              {user ? (
                isAlreadyAdded ? (
                  <Link href="/dashboard">
                    <Button variant="outline">
                      <Check className="h-4 w-4 mr-2" />
                      Déjà ajouté - Voir mes sets
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" onClick={handleAddToMySets}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Ajouter à mes sets
                  </Button>
                )
              ) : (
                <Link href={`/login?redirect=/s/${shareId}`}>
                  <Button variant="outline">
                    <LogIn className="h-4 w-4 mr-2" />
                    Se connecter pour ajouter
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {set.flashcards && set.flashcards.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {set.flashcards.map((card) => (
                <Card key={card.id}>
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-[12px] text-dark-text-muted">Front</span>
                      <FormattedText text={card.front} className="text-[16px] text-white mt-1" as="p" />
                    </div>
                    <div>
                      <span className="text-[12px] text-dark-text-muted">Back</span>
                      <FormattedText text={card.back} className="text-[16px] text-white mt-1" as="p" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="emptyState" className="text-center py-12">
              <p className="text-[16px] text-white">Aucune flashcard dans ce set</p>
            </Card>
          )}
        </div>
      </div>

      <PasswordPromptModal
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          if (!passwordVerified) {
            router.push('/');
          }
        }}
        onSubmit={handlePasswordSubmit}
        setTitle={set.title}
      />
    </>
  );
}
