'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { X, Lock } from 'lucide-react';

interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: string | null) => Promise<void>;
  currentPassword?: string | null;
  setIsPublic: (isPublic: boolean) => Promise<void>;
  currentIsPublic: boolean;
}

export function SetPasswordModal({
  isOpen,
  onClose,
  onSave,
  currentPassword,
  setIsPublic,
  currentIsPublic,
}: SetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPublic, setIsPublicLocal] = useState(currentIsPublic);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
      
      onClose();
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-brand-primary" />
            <CardTitle className="text-[16px] text-white">Gérer le partage</CardTitle>
          </div>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        
        <div className="p-6 space-y-4">
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
                Permet aux autres utilisateurs de voir ce set
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

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Annuler
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

