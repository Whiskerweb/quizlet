'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { X, Lock, Copy, Check, Share2, Users, User } from 'lucide-react';
import { sharedSetsService } from '@/lib/supabase/shared-sets';

interface ShareManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: string | null) => Promise<void>;
  currentPassword?: string | null;
  setIsPublic: (isPublic: boolean) => Promise<void>;
  currentIsPublic: boolean;
  shareId: string;
  setTitle: string;
  setId: string;
}

interface SetUser {
  id: string;
  username: string;
  avatar: string | null;
  added_at: string;
}

export function ShareManageModal({
  isOpen,
  onClose,
  onSave,
  currentPassword,
  setIsPublic,
  currentIsPublic,
  shareId,
  setTitle,
  setId,
}: ShareManageModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPublic, setIsPublicLocal] = useState(currentIsPublic);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [setUsers, setSetUsers] = useState<SetUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/s/${shareId}`
    : '';

  useEffect(() => {
    if (isOpen && isPublic) {
      loadSetUsers();
    }
  }, [isOpen, isPublic, setId]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const loadSetUsers = async () => {
    if (!isPublic) return;
    
    try {
      setIsLoadingUsers(true);
      const users = await sharedSetsService.getSetUsers(setId);
      setSetUsers(users);
    } catch (err: any) {
      console.error('Failed to load set users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
    }
  };

  const handleSave = async () => {
    setError(null);

    // If making public and password is set, validate
    if (isPublic && password) {
      if (password.length < 4) {
        setError('Le mot de passe doit contenir au moins 4 caractères');
        return;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
    }

    setIsLoading(true);
    try {
      // First update public status
      await setIsPublic(isPublic);
      
      // Then update password
      if (isPublic && password) {
        await onSave(password);
      } else {
        await onSave(null);
      }
      
      // Reload users if public
      if (isPublic) {
        await loadSetUsers();
      }
      
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await onSave(null);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-brand-primary" />
            <CardTitle className="text-[16px] text-white">Gérer le partage</CardTitle>
          </div>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-[14px]">
              {error}
            </div>
          )}

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 bg-dark-background-cardMuted rounded-lg">
            <div>
              <p className="text-[16px] text-white font-medium">Rendre public</p>
              <p className="text-[14px] text-dark-text-secondary mt-1">
                Permet aux autres utilisateurs de voir et partager ce set
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublicLocal(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-background-cardMuted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
            </label>
          </div>

          {/* Password Section */}
          {isPublic && (
            <div className="space-y-4 p-4 bg-dark-background-cardMuted rounded-lg">
              <div>
                <label className="block text-[14px] text-white mb-2">
                  Mot de passe (optionnel)
                </label>
                <p className="text-[12px] text-dark-text-secondary mb-3">
                  Les utilisateurs devront saisir ce mot de passe pour ajouter ce set à leur profil
                </p>
                {currentPassword ? (
                  <div className="space-y-2">
                    <div className="p-2 bg-dark-background-base rounded border border-[rgba(255,255,255,0.06)]">
                      <p className="text-[12px] text-dark-text-secondary">Mot de passe actuel configuré</p>
                    </div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nouveau mot de passe (laisser vide pour garder l'actuel)"
                      className="mb-2"
                    />
                    {password && (
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmer le nouveau mot de passe"
                      />
                    )}
                  </div>
                ) : (
                  <>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Laisser vide pour aucun mot de passe"
                      className="mb-2"
                    />
                    {password && (
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmer le mot de passe"
                      />
                    )}
                  </>
                )}
              </div>

              {currentPassword && (
                <Button
                  variant="outline"
                  onClick={handleRemovePassword}
                  disabled={isLoading}
                  className="w-full text-dark-states-danger border-dark-states-danger"
                >
                  Supprimer le mot de passe
                </Button>
              )}
            </div>
          )}

          {/* Share Link Section - Only show if public */}
          {isPublic && (
            <div className="space-y-4 p-4 bg-dark-background-cardMuted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="h-5 w-5 text-brand-primary" />
                <p className="text-[16px] text-white font-medium">Lien de partage</p>
              </div>
              <p className="text-[12px] text-dark-text-secondary mb-3">
                Partagez ce lien pour permettre à n'importe qui d'accéder à ce set
              </p>
              {currentPassword && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                  <p className="text-[12px] text-yellow-800">
                    ⚠️ Ce set est protégé par un mot de passe. Les personnes qui accèdent au lien devront saisir le mot de passe.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-dark-background-base"
                />
                <Button
                  onClick={handleCopy}
                  variant={copied ? 'secondary' : 'primary'}
                  className="min-w-[100px]"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Users who added this set */}
          {isPublic && (
            <div className="space-y-4 p-4 bg-dark-background-cardMuted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-brand-primary" />
                <p className="text-[16px] text-white font-medium">
                  Utilisateurs ayant enregistré ce set ({setUsers.length})
                </p>
              </div>
              {isLoadingUsers ? (
                <p className="text-[14px] text-dark-text-secondary">Chargement...</p>
              ) : setUsers.length === 0 ? (
                <p className="text-[14px] text-dark-text-secondary">
                  Aucun utilisateur n'a encore enregistré ce set
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {setUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 bg-dark-background-base rounded-lg"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-dark-background-cardMuted flex items-center justify-center">
                          <User className="h-4 w-4 text-dark-text-secondary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-[14px] text-white">{user.username}</p>
                        <p className="text-[12px] text-dark-text-secondary">
                          Ajouté le {new Date(user.added_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Fermer
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}



