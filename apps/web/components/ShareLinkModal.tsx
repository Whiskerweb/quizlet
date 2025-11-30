'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string;
  setTitle: string;
  hasPassword: boolean;
}

export function ShareLinkModal({
  isOpen,
  onClose,
  shareId,
  setTitle,
  hasPassword,
}: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/s/${shareId}`
    : '';

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-brand-primary" />
            <CardTitle className="text-[16px] text-white">Partager ce set</CardTitle>
          </div>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        
        <div className="p-6 space-y-4">
          <div className="p-3 bg-dark-background-cardMuted rounded-lg">
            <p className="text-[14px] text-dark-text-secondary mb-1">Set :</p>
            <p className="text-[16px] text-white font-medium">{setTitle}</p>
          </div>

          {hasPassword && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-[14px] text-yellow-800">
                ⚠️ Ce set est protégé par un mot de passe. Les personnes qui accèdent au lien devront saisir le mot de passe pour voir les flashcards.
              </p>
            </div>
          )}

          <div>
            <label className="block text-[14px] text-white mb-2">
              Lien de partage
            </label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 bg-dark-background-cardMuted"
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

          <div className="pt-2">
            <Button
              onClick={onClose}
              className="w-full"
            >
              Fermer
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}


