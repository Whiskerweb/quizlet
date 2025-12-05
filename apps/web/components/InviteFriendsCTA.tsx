'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { friendsService, type InvitationCode } from '@/lib/supabase/friends';
import { useAuthStore } from '@/store/authStore';
import { 
  Users, 
  Link as LinkIcon, 
  Check, 
  Copy, 
  Sparkles, 
  UserPlus,
  Share2,
  X
} from 'lucide-react';

export function InviteFriendsCTA() {
  const { profile } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState<InvitationCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    loadFriendCount();
    loadInviteCode();
  }, []);

  const loadFriendCount = async () => {
    try {
      const count = await friendsService.getFriendCount();
      setFriendCount(count);
    } catch (error) {
      console.error('Failed to load friend count:', error);
    }
  };

  const loadInviteCode = async () => {
    try {
      const codes = await friendsService.getMyInviteCodes();
      if (codes.length > 0) {
        // Use the most recent valid code
        const validCode = codes.find(c => 
          new Date(c.expires_at) > new Date() && 
          c.uses_count < c.max_uses
        );
        if (validCode) {
          setInviteCode(validCode);
        }
      }
    } catch (error) {
      console.error('Failed to load invite codes:', error);
    }
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const code = await friendsService.generateInviteCode();
      setInviteCode(code);
    } catch (error) {
      console.error('Failed to generate invite code:', error);
      alert('Échec de la génération du code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteCode) return;
    
    const link = friendsService.getInviteLink(inviteCode.code);
    
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    
    const link = friendsService.getInviteLink(inviteCode.code);
    const text = `Rejoins-moi sur Quizlet pour réviser ensemble ! 🚀`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Invitation Quizlet',
          text,
          url: link,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full group"
      >
        <div className="relative overflow-hidden rounded-2xl border-2 border-border-subtle hover:border-brand-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-lg bg-bg-emphasis">
          {/* Subtle animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-brand-primarySoft/5 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/3 via-transparent to-brand-primarySoft/3 animate-pulse" />
          
          {/* Shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-brand-primary/10 to-transparent skew-x-12" />
          </div>
          
          <div className="relative p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primaryDark text-content-inverted shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                  <Users className="h-7 w-7" />
                </div>
                <div className="text-left">
                  <div className="text-base sm:text-lg font-bold text-content-emphasis flex items-center gap-2">
                    Invite tes amis
                    <Sparkles className="h-5 w-5 text-brand-primary animate-pulse" />
                  </div>
                  <div className="text-sm text-content-muted mt-1 font-medium">
                    {friendCount > 0 
                      ? `${friendCount} ami${friendCount > 1 ? 's' : ''} • Partagez vos cardz`
                      : `${profile?.username}, tu vas quand même pas réviser tout(e) seul(e) non ????`}
                  </div>
                </div>
              </div>
              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-primary/10 border border-brand-primary/20">
                  <span className="text-xs font-semibold text-brand-primary hidden sm:inline">Découvrir</span>
                  <UserPlus className="h-5 w-5 text-brand-primary" />
                </div>
              </div>
            </div>
            
            {/* Badge "Nouveau" */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary text-content-inverted text-[10px] font-bold uppercase tracking-wider shadow-lg animate-bounce">
                <Sparkles className="h-3 w-3" />
                Nouveau
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10" />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-content-emphasis flex items-center gap-2">
                Invite tes amis
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </h3>
              <p className="text-xs text-content-muted mt-0.5">
                Partagez vos cardz et révisez ensemble
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="shrink-0 p-1 rounded-lg hover:bg-bg-subtle transition-colors"
          >
            <X className="h-4 w-4 text-content-muted" />
          </button>
        </div>

        {!inviteCode ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <UserPlus className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-900">
                Génère un lien d'invitation et partage-le avec tes amis. 
                Dès qu'ils créent un compte, vous devenez amis automatiquement !
              </p>
            </div>
            <Button
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="w-full"
            >
              <LinkIcon className="h-4 w-4" />
              {isGenerating ? 'Génération...' : 'Générer mon lien d\'invitation'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-bg-subtle border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-content-muted uppercase tracking-wider">
                  Ton code d'invitation
                </span>
                <span className="text-xs text-content-muted">
                  {inviteCode.uses_count}/{inviteCode.max_uses} utilisations
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-border-subtle font-mono text-sm font-bold text-content-emphasis">
                {inviteCode.code}
              </div>
              <div className="text-[10px] text-content-subtle mt-2">
                Expire le {new Date(inviteCode.expires_at).toLocaleDateString('fr-FR')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={handleCopyLink}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copier le lien
                  </>
                )}
              </Button>
              <Button
                onClick={handleShare}
                className="w-full"
              >
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-green-900 mb-1">
                  Comment ça marche ?
                </p>
                <ol className="text-xs text-green-800 space-y-1 list-decimal list-inside">
                  <li>Partage ton lien avec tes amis</li>
                  <li>Ils créent un compte via ton lien</li>
                  <li>Vous devenez amis automatiquement</li>
                  <li>Partagez vos cardz et révisez ensemble !</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
