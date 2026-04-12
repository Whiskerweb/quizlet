'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { X, Lock } from 'lucide-react';

interface PasswordPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
  setTitle: string;
}

export function PasswordPromptModal({
  isOpen,
  onClose,
  onSubmit,
  setTitle,
}: PasswordPromptModalProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async () => {
    setError(null);
    
    if (!password) {
      setError('Veuillez saisir le mot de passe');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(password);
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      style={{ position: 'fixed', zIndex: 9999 }}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <Card 
        className="w-full max-w-md relative z-[10000]"
        style={{ position: 'relative', zIndex: 10000 }}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-brand-primary" />
            <CardTitle className="text-[16px] text-white">Mot de passe requis</CardTitle>
          </div>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        
        <div className="p-6 space-y-4">
          <p className="text-[16px] text-white">
            Ce set est protégé par un mot de passe. Veuillez le saisir pour l'ajouter à votre profil.
          </p>
          
          <div className="p-3 bg-dark-background-cardMuted rounded-lg">
            <p className="text-[14px] text-dark-text-secondary mb-1">Set :</p>
            <p className="text-[16px] text-white font-medium">{setTitle}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-[14px]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[14px] text-white mb-2">
              Mot de passe
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              placeholder="Saisir le mot de passe"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !password}
              className="flex-1"
            >
              {isLoading ? 'Vérification...' : 'Valider'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  // Render in a portal to avoid z-index issues
  return createPortal(modalContent, document.body);
}


