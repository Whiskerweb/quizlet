'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Copy, Globe, Lock } from 'lucide-react';

interface ShareManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: string | null) => void;
  currentPassword: string | null;
  setIsPublic: (isPublic: boolean) => void;
  currentIsPublic: boolean;
  shareId: string;
  setTitle: string;
  setId: string;
  currentSubject?: string | null;
  onSaveSubject?: (subject: string | null) => void;
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
  currentSubject,
  onSaveSubject,
}: ShareManageModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>(currentSubject || '');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setCopied(false);
      setSelectedSubject(currentSubject || '');
    }
  }, [isOpen, currentSubject]);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/s/${shareId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSave = () => {
    onSave(password || null);
    if (onSaveSubject && currentIsPublic) {
      onSaveSubject(selectedSubject || null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-background-card border border-[rgba(255,255,255,0.12)] rounded-lg p-6 max-w-md w-full mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Partager "{setTitle}"</h2>
          <button
            onClick={onClose}
            className="text-dark-text-secondary hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Public/Private Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={currentIsPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 rounded border-[rgba(255,255,255,0.12)] bg-dark-background-base text-brand-primary focus:ring-2 focus:ring-brand-primary"
            />
            <div className="flex items-center gap-2">
              {currentIsPublic ? (
                <Globe className="h-5 w-5 text-brand-primary" />
              ) : (
                <Lock className="h-5 w-5 text-dark-text-secondary" />
              )}
              <span className="text-white font-medium">
                {currentIsPublic ? 'Public' : 'Privé'}
              </span>
            </div>
          </label>
          <p className="text-sm text-dark-text-secondary mt-2 ml-8">
            {currentIsPublic
              ? 'Ce set est visible par tous et peut être trouvé dans la recherche publique.'
              : 'Ce set est privé et accessible uniquement via le lien de partage.'}
          </p>
        </div>

        {/* Subject Selection (only if public) */}
        {currentIsPublic && onSaveSubject && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Catégorie d'étude <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 bg-dark-background-base border border-[rgba(255,255,255,0.12)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              <option value="mathematiques">Mathématiques</option>
              <option value="francais">Français</option>
              <option value="anglais">Anglais</option>
              <option value="histoire">Histoire</option>
              <option value="geographie">Géographie</option>
              <option value="sciences">Sciences</option>
              <option value="physique">Physique</option>
              <option value="chimie">Chimie</option>
              <option value="biologie">Biologie</option>
              <option value="philosophie">Philosophie</option>
              <option value="economie">Économie</option>
              <option value="droit">Droit</option>
              <option value="medecine">Médecine</option>
              <option value="informatique">Informatique</option>
              <option value="marketing">Marketing</option>
              <option value="gestion">Gestion</option>
              <option value="psychologie">Psychologie</option>
              <option value="sociologie">Sociologie</option>
              <option value="art">Art</option>
              <option value="musique">Musique</option>
              <option value="sport">Sport</option>
              <option value="langues">Langues étrangères</option>
              <option value="litterature">Littérature</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        )}

        {/* Password Protection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Mot de passe (optionnel)
          </label>
          <div className="flex gap-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={currentPassword ? 'Nouveau mot de passe' : 'Définir un mot de passe'}
              className="flex-1 px-4 py-2 bg-dark-background-base border border-[rgba(255,255,255,0.12)] rounded-lg text-white placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <Button
              variant="outline"
              onClick={() => setShowPassword(!showPassword)}
              className="px-4"
            >
              {showPassword ? 'Cacher' : 'Voir'}
            </Button>
          </div>
          {currentPassword && (
            <p className="text-xs text-dark-text-secondary mt-2">
              Un mot de passe est actuellement défini. Laissez vide pour le supprimer.
            </p>
          )}
        </div>

        {/* Share Link */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Lien de partage
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-2 bg-dark-background-base border border-[rgba(255,255,255,0.12)] rounded-lg text-white text-sm focus:outline-none"
            />
            <Button
              variant="outline"
              onClick={handleCopy}
              className="px-4"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copié!' : 'Copier'}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={currentIsPublic && onSaveSubject && !selectedSubject}
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

