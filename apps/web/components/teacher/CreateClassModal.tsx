'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { X } from 'lucide-react';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description?: string }) => Promise<void>;
}

export function CreateClassModal({ isOpen, onClose, onCreate }: CreateClassModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Le nom de la classe est obligatoire');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      
      // Reset form
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-content-emphasis">Créer une classe</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-content-muted hover:bg-bg-subtle hover:text-content-emphasis"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="className" className="block text-sm font-medium text-content-emphasis mb-2">
              Nom de la classe <span className="text-red-500">*</span>
            </label>
            <Input
              id="className"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: 3ème A, Terminale S1..."
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="classDescription" className="block text-sm font-medium text-content-emphasis mb-2">
              Description <span className="text-sm text-content-muted">(optionnel)</span>
            </label>
            <Textarea
              id="classDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Classe de mathématiques avancées"
              disabled={isSubmitting}
              rows={3}
              className="w-full"
            />
          </div>

          <div className="text-sm text-content-muted bg-blue-50 border border-blue-200 rounded-lg p-3">
            💡 <strong>Astuce :</strong> Un code unique sera automatiquement généré pour cette classe. 
            Vous pourrez le partager avec vos élèves pour qu'ils rejoignent la classe.
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1"
            >
              {isSubmitting ? 'Création...' : 'Créer la classe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

