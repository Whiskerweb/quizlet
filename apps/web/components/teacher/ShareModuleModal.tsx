'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { foldersService } from '@/lib/supabase/folders';
import { classModulesService } from '@/lib/supabase/class-modules';
import { classesService } from '@/lib/supabase/classes';
import { Button } from '@/components/ui/Button';
import { Folder, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ShareModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
}

interface FolderItem {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

interface ClassItem {
  class_id: string;
  class_name: string;
  class_color: string;
}

export function ShareModuleModal({ isOpen, onClose, classId, onSuccess }: ShareModuleModalProps) {
  const { profile } = useAuthStore();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && profile?.role === 'teacher') {
      loadFolders();
    }
  }, [isOpen, profile]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const data = await foldersService.getAll();
      setFolders(data.map((f: any) => ({
        id: f.id,
        name: f.name,
        color: f.color || '#3b82f6',
        description: f.description,
      })));
    } catch (err) {
      console.error('Failed to load folders:', err);
      setError('Impossible de charger les modules');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedFolderId) {
      setError('Veuillez sélectionner un module');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await classModulesService.shareModuleWithClass(selectedFolderId, classId);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedFolderId(null);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to share module:', err);
      setError(err.message || 'Erreur lors du partage');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border-subtle bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-semibold text-content-emphasis">
              Partager un module avec cette classe
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-subtle rounded-lg transition"
              disabled={loading}
            >
              <X className="h-5 w-5 text-content-muted" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-[14px]">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-[14px]">
              <CheckCircle2 className="h-4 w-4" />
              Module partagé avec succès !
            </div>
          )}

          <div className="space-y-4">
          <div>
            <label className="block text-[14px] font-medium text-content-emphasis mb-2">
              Sélectionnez un module à partager
            </label>
            <p className="text-[13px] text-content-muted mb-3">
              Le module sera visible dans la classe, mais restera aussi dans "Votre espace"
            </p>
            
            {loading && !folders.length ? (
              <div className="py-8 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto" />
              </div>
            ) : folders.length === 0 ? (
              <div className="py-8 text-center border border-border-subtle rounded-lg">
                <Folder className="h-12 w-12 text-content-subtle mx-auto mb-2" />
                <p className="text-[14px] text-content-muted">
                  Aucun module disponible
                </p>
                <p className="text-[13px] text-content-subtle mt-1">
                  Créez d'abord un module dans "Votre espace"
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedFolderId === folder.id
                        ? 'border-brand-primary bg-blue-50'
                        : 'border-border-subtle hover:border-border-default hover:bg-bg-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: folder.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium text-content-emphasis truncate">
                          {folder.name}
                        </p>
                        {folder.description && (
                          <p className="text-[13px] text-content-muted truncate mt-0.5">
                            {folder.description}
                          </p>
                        )}
                      </div>
                      {selectedFolderId === folder.id && (
                        <CheckCircle2 className="h-5 w-5 text-brand-primary flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

            <div className="flex gap-3 pt-4 border-t border-border-subtle">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleShare}
                className="flex-1"
                disabled={loading || !selectedFolderId || success}
              >
                {loading ? 'Partage...' : success ? 'Partagé !' : 'Partager'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

