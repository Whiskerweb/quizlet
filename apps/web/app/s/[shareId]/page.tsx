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
      
      console.log('Loading set with shareId:', shareId);
      
      let data;
      try {
        data = await setsService.getByShareId(shareId);
        console.log('Set loaded successfully:', data ? { 
          id: data.id, 
          title: data.title, 
          is_public: data.is_public, 
          has_password: !!data.password_hash,
          share_id: data.share_id
        } : 'null');
      } catch (fetchError: any) {
        console.error('Error in getByShareId:', fetchError);
        // If it's a "not found" error, show specific message
        if (fetchError.message?.includes('non trouvé') || fetchError.code === 'PGRST116') {
          setError('Set non trouvé. Vérifiez que le lien de partage est correct.');
        } else {
          setError(fetchError.message || 'Erreur lors du chargement du set');
        }
        setIsLoading(false);
        return;
      }
      
      if (!data) {
        console.error('No data returned from getByShareId');
        setError('Set non trouvé');
        setIsLoading(false);
        return;
      }
      
      // Always set the set data first, even if not public or has password
      setSet(data);
      setIsLoading(false);
      
      // Check if set is public
      if (!data.is_public) {
        console.log('Set is not public');
        setError('Ce set n\'est pas public');
        return;
      }

      // Check if password is required
      if (data.password_hash) {
        console.log('Set has password, checking access...');
        // Check if user already has access
        if (user) {
          try {
            const hasAccess = await sharedSetsService.hasAccess(data.id);
            console.log('User has access:', hasAccess);
            if (hasAccess) {
              setPasswordVerified(true);
              setIsAlreadyAdded(true);
              return;
            }
          } catch (err) {
            // If hasAccess fails, continue to show password modal
            console.error('Error checking access:', err);
          }
        }
        // Password required - show modal
        console.log('Opening password modal');
        setPasswordModalOpen(true);
        return;
      }

      // No password required - check if already added
      if (user) {
        try {
          const hasAccess = await sharedSetsService.hasAccess(data.id);
          setIsAlreadyAdded(hasAccess);
        } catch (err) {
          // Ignore error, just don't mark as added
          console.error('Error checking access:', err);
        }
      }
    } catch (err: any) {
      console.error('Unexpected error in loadSet:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        stack: err.stack
      });
      
      setError(err.message || 'Erreur lors du chargement du set');
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

  // Show error only if we have an error and no set data
  if (error && !set) {
    return (
      <div className="min-h-screen bg-dark-background-base flex items-center justify-center px-4">
        <Card className="p-6 sm:p-8 text-center max-w-md w-full border border-[rgba(255,255,255,0.06)]">
          <p className="text-[14px] sm:text-[16px] text-white mb-4">{error || 'Set non trouvé'}</p>
          <Link href="/">
            <Button className="w-full sm:w-auto text-[14px] sm:text-[15px] h-10 sm:h-11">
              Retour à l'accueil
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // If no set loaded and no error, show not found
  if (!set) {
    return (
      <div className="min-h-screen bg-dark-background-base flex items-center justify-center px-4">
        <Card className="p-6 sm:p-8 text-center max-w-md w-full border border-[rgba(255,255,255,0.06)]">
          <p className="text-[14px] sm:text-[16px] text-white mb-4">Set non trouvé</p>
          <Link href="/">
            <Button className="w-full sm:w-auto text-[14px] sm:text-[15px] h-10 sm:h-11">
              Retour à l'accueil
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // If password required and not verified, show the set with password prompt
  if (set.password_hash && !passwordVerified) {
    // Show the set but with password prompt (don't show flashcards until password is verified)
    return (
      <>
        <div className="min-h-screen bg-dark-background-base">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-[22px] sm:text-[24px] lg:text-[28px] font-bold text-white mb-2 leading-tight">
                {set.title}
              </h1>
              {set.description && (
                <p className="text-[14px] sm:text-[16px] text-dark-text-secondary mb-3 sm:mb-4">
                  {set.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
                {set.user && (
                  <div className="flex items-center text-[12px] sm:text-[14px] text-dark-text-secondary">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                    {set.user.username}
                  </div>
                )}
                <span className="text-[12px] sm:text-[14px] text-dark-text-secondary">
                  {set.flashcards?.length || 0} {set.flashcards?.length === 1 ? 'carte' : 'cartes'}
                </span>
                {set.language && (
                  <span className="text-[12px] sm:text-[14px] text-dark-text-secondary">
                    Langue: {set.language}
                  </span>
                )}
                {set.password_hash && (
                  <div className="flex items-center text-[12px] sm:text-[14px] text-brand-primary">
                    <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                    Protégé par mot de passe
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {user ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setPasswordModalOpen(true)}
                    className="w-full sm:w-auto text-[13px] sm:text-[14px] h-10 sm:h-11"
                  >
                    <Lock className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Entrer le mot de passe pour ajouter</span>
                    <span className="sm:hidden">Entrer le mot de passe</span>
                  </Button>
                ) : (
                  <Link href={`/login?redirect=/s/${shareId}`} className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto text-[13px] sm:text-[14px] h-10 sm:h-11">
                      <LogIn className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Se connecter pour ajouter</span>
                      <span className="sm:hidden">Se connecter</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <Card className="p-5 sm:p-6 text-center border border-[rgba(255,255,255,0.06)]">
              <Lock className="h-10 w-10 sm:h-12 sm:w-12 text-brand-primary mx-auto mb-3 sm:mb-4" />
              <p className="text-[14px] sm:text-[16px] text-white mb-4 leading-relaxed">
                Ce set est protégé par un mot de passe. Entrez le mot de passe pour voir le contenu et l'ajouter à votre profil.
              </p>
              {user && (
                <Button 
                  onClick={() => setPasswordModalOpen(true)}
                  className="w-full sm:w-auto text-[13px] sm:text-[14px] h-10 sm:h-11"
                >
                  <Lock className="h-4 w-4 sm:mr-2" />
                  Entrer le mot de passe
                </Button>
              )}
            </Card>
          </div>
        </div>
        <PasswordPromptModal
          isOpen={passwordModalOpen}
          onClose={() => {
            setPasswordModalOpen(false);
            // Don't redirect, just close the modal so user can see the set info
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-[22px] sm:text-[24px] lg:text-[28px] font-bold text-white mb-2 leading-tight">
              {set.title}
            </h1>
            {set.description && (
              <p className="text-[14px] sm:text-[16px] text-dark-text-secondary mb-3 sm:mb-4">
                {set.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
              {set.user && (
                <div className="flex items-center text-[12px] sm:text-[14px] text-dark-text-secondary">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                  {set.user.username}
                </div>
              )}
              <span className="text-[12px] sm:text-[14px] text-dark-text-secondary">
                {set.flashcards?.length || 0} {set.flashcards?.length === 1 ? 'carte' : 'cartes'}
              </span>
              {set.language && (
                <span className="text-[12px] sm:text-[14px] text-dark-text-secondary">
                  Langue: {set.language}
                </span>
              )}
              {set.password_hash && (
                <div className="flex items-center text-[12px] sm:text-[14px] text-brand-primary">
                  <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                  Protégé
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href={`/study/${set.id}`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto text-[13px] sm:text-[14px] h-10 sm:h-11">
                  <Play className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Étudier ce set</span>
                  <span className="sm:hidden">Étudier</span>
                </Button>
              </Link>
              {user ? (
                isAlreadyAdded ? (
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto text-[13px] sm:text-[14px] h-10 sm:h-11">
                      <Check className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Déjà ajouté - Voir mes sets</span>
                      <span className="sm:hidden">Déjà ajouté</span>
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleAddToMySets}
                    className="w-full sm:w-auto text-[13px] sm:text-[14px] h-10 sm:h-11"
                  >
                    <Share2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Ajouter à mes sets</span>
                    <span className="sm:hidden">Ajouter</span>
                  </Button>
                )
              ) : (
                <Link href={`/login?redirect=/s/${shareId}`} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto text-[13px] sm:text-[14px] h-10 sm:h-11">
                    <LogIn className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Se connecter pour ajouter</span>
                    <span className="sm:hidden">Se connecter</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {set.flashcards && set.flashcards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {set.flashcards.map((card) => (
                <Card key={card.id} className="border border-[rgba(255,255,255,0.06)]">
                  <div className="p-4 sm:p-5">
                    <div className="mb-3 sm:mb-4">
                      <span className="text-[11px] sm:text-[12px] text-dark-text-muted uppercase tracking-wide">
                        Front
                      </span>
                      <FormattedText 
                        text={card.front} 
                        className="text-[15px] sm:text-[16px] text-white mt-1.5 sm:mt-2" 
                        as="p" 
                      />
                    </div>
                    <div>
                      <span className="text-[11px] sm:text-[12px] text-dark-text-muted uppercase tracking-wide">
                        Back
                      </span>
                      <FormattedText 
                        text={card.back} 
                        className="text-[15px] sm:text-[16px] text-white mt-1.5 sm:mt-2" 
                        as="p" 
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="emptyState" className="text-center py-10 sm:py-12 border border-[rgba(255,255,255,0.06)]">
              <p className="text-[14px] sm:text-[16px] text-white">Aucune flashcard dans ce set</p>
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
