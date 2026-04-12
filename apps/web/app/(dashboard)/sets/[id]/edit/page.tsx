'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { setsService } from '@/lib/supabase/sets';
import { flashcardsService } from '@/lib/supabase/flashcards';
import type { SetWithFlashcards } from '@/lib/supabase/sets';
import type { ParsedCard } from '@/lib/utils/parseImportedText';
import { ImportModal } from '@/components/ImportModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { RichTextEditor } from '@/components/RichTextEditor';
import { GripVertical, Trash2, Image as ImageIcon, Plus } from 'lucide-react';

interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  imageUrl?: string | null;
}

export default function EditSetPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const setId = params.id as string;
  const [set, setSet] = useState<SetWithFlashcards | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [newlyAddedCardId, setNewlyAddedCardId] = useState<string | null>(null);
  const [setTitle, setSetTitle] = useState('');
  const [setDescription, setSetDescription] = useState('');

  useEffect(() => {
    loadSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const loadSet = async () => {
    try {
      setIsLoading(true);
      const data = await setsService.getOne(setId);
      setSet(data);
      setSetTitle(data.title || '');
      setSetDescription(data.description || '');
      // Sort flashcards by order to ensure correct order
      const sortedFlashcards = (data.flashcards || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((card) => ({
          id: card.id,
          front: card.front,
          back: card.back,
          imageUrl: card.image_url || null,
        }));
      
      // If no flashcards exist, add one empty card by default
      if (sortedFlashcards.length === 0) {
        const emptyCard = {
          id: `temp-${Date.now()}`,
          front: '',
          back: '',
          imageUrl: null,
        };
        setFlashcards([emptyCard]);
        setNewlyAddedCardId(emptyCard.id);
        setTimeout(() => {
          setNewlyAddedCardId(null);
        }, 600);
      } else {
        setFlashcards(sortedFlashcards);
      }
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load set:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = (insertAfterIndex?: number) => {
    const newCard = {
      id: `temp-${Date.now()}`,
      front: '',
      back: '',
      imageUrl: null,
    };

    if (insertAfterIndex !== undefined) {
      // Insert after the specified index
      const newFlashcards = [...flashcards];
      newFlashcards.splice(insertAfterIndex + 1, 0, newCard);
      setFlashcards(newFlashcards);
    } else {
      // Add at the end (default behavior)
      setFlashcards([...flashcards, newCard]);
    }
    
    // Trigger animation
    setNewlyAddedCardId(newCard.id);
    setHasUnsavedChanges(true);
    
    // Remove animation class after animation completes
    setTimeout(() => {
      setNewlyAddedCardId(null);
    }, 600);
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) return;

    // If it's a temporary card (starts with "temp-"), just remove it from state
    if (id.startsWith('temp-')) {
      setFlashcards(flashcards.filter((card) => card.id !== id));
      return;
    }

    try {
      await flashcardsService.delete(id);
      setFlashcards(flashcards.filter((card) => card.id !== id));
      // Optionally reload to ensure consistency
      await loadSet();
    } catch (error) {
      console.error('Failed to delete cardz:', error);
      alert('Failed to delete cardz');
    }
  };

  const handleUpdateCard = (id: string, field: 'front' | 'back', value: string) => {
    setHasUnsavedChanges(true);
    setFlashcards(
      flashcards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      )
    );
  };

  const handleSetTitleChange = (value: string) => {
    setSetTitle(value);
    setHasUnsavedChanges(true);
  };

  const handleSetDescriptionChange = (value: string) => {
    setSetDescription(value);
    setHasUnsavedChanges(true);
  };

  const handleUpdateSetInfo = async () => {
    if (!set) return;
    
    try {
      await setsService.update(setId, {
        title: setTitle || 'Untitled Set',
        description: setDescription || null,
      });
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to update set info:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update set title and description
      if (set && (setTitle !== set.title || setDescription !== (set.description || ''))) {
        await setsService.update(setId, {
          title: setTitle || 'Set sans titre',
          description: setDescription || null,
        });
      }

      // Save all flashcards and update their order
      const existingCardIds: string[] = [];
      
      for (let index = 0; index < flashcards.length; index++) {
        const card = flashcards[index];
        if (card.id.startsWith('temp-')) {
          // Create new card
          await flashcardsService.create(setId, {
            front: card.front,
            back: card.back,
            image_url: card.imageUrl || null,
          });
        } else {
          // Update existing card
          await flashcardsService.update(card.id, {
            front: card.front,
            back: card.back,
            image_url: card.imageUrl || null,
          });
          existingCardIds.push(card.id);
        }
      }

      // Update order for all existing cards
      if (existingCardIds.length > 0) {
        await flashcardsService.reorder(setId, existingCardIds);
      }

      // Reload to get updated data
      await loadSet();
      setHasUnsavedChanges(false);
      // Rediriger vers le dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save flashcards:', error);
      alert('Erreur lors de l\'enregistrement des flashcards');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = async (cards: ParsedCard[]) => {
    try {
      await flashcardsService.import(setId, cards);
      await loadSet();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to import flashcards:', error);
      alert('Erreur lors de l\'importation des flashcards');
    }
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', cardId);
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleDragOver = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedCardId && draggedCardId !== cardId) {
      setDragOverCardId(cardId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCardId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    setDragOverCardId(null);

    if (!draggedCardId || draggedCardId === targetCardId) {
      return;
    }

    const draggedIndex = flashcards.findIndex((card) => card.id === draggedCardId);
    const targetIndex = flashcards.findIndex((card) => card.id === targetCardId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    // Reorder flashcards in state
    const newFlashcards = [...flashcards];
    const [removed] = newFlashcards.splice(draggedIndex, 1);
    newFlashcards.splice(targetIndex, 0, removed);
    setFlashcards(newFlashcards);
    setHasUnsavedChanges(true);

    // Save order to database (only for existing cards, not temp ones)
    const existingCardIds = newFlashcards
      .filter((card) => !card.id.startsWith('temp-'))
      .map((card) => card.id);

    if (existingCardIds.length > 0) {
      try {
        await flashcardsService.reorder(setId, existingCardIds);
      } catch (error) {
        console.error('Failed to reorder flashcards:', error);
        // Revert on error
        await loadSet();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>{t('setNotFound')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Set Title and Description */}
      <div className="mb-6">
        <div className="mb-4">
          <label htmlFor="set-title" className="mb-1.5 block text-[13px] font-medium text-content-emphasis sm:text-[14px] sm:mb-2">
            {t('setTitle')} *
          </label>
          <Input
            id="set-title"
            value={setTitle}
            onChange={(e) => handleSetTitleChange(e.target.value)}
            placeholder={t('setTitlePlaceholder')}
            className="text-[14px] sm:text-[15px]"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="set-description" className="mb-1.5 block text-[13px] font-medium text-content-emphasis sm:text-[14px] sm:mb-2">
            Description
          </label>
          <Textarea
            id="set-description"
            value={setDescription}
            onChange={(e) => handleSetDescriptionChange(e.target.value)}
            placeholder="Décrivez votre set..."
            rows={3}
            className="text-[14px] sm:text-[15px]"
          />
        </div>
      </div>

      {/* Import Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-content-emphasis mb-1">{t('cards')}</h2>
          <p className="text-[13px] text-content-muted">{t('manageOrImportCards')}</p>
        </div>
        <Button onClick={() => setIsImportModalOpen(true)}>
          {t('import')}
        </Button>
      </div>

      {/* Flashcards List */}
      <div className="space-y-4 mb-6">
        {flashcards.map((card, index) => (
          <div
            key={card.id}
            className={`group relative ${
              newlyAddedCardId === card.id
                ? 'animate-slideIn'
                : ''
            }`}
          >
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, card.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, card.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, card.id)}
              className={`transition-all ${
                draggedCardId === card.id ? 'opacity-50' : ''
              } ${
                dragOverCardId === card.id ? 'transform translate-y-1' : ''
              }`}
            >
              <Card
                className={`p-4 transition-all ${
                  dragOverCardId === card.id ? 'border-2 border-brand-primary shadow-card' : ''
                } ${
                  newlyAddedCardId === card.id
                    ? 'bg-bg-subtle border-brand-primary'
                    : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div
                    className="flex-shrink-0 pt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>

              {/* Card Number */}
              <div className="flex-shrink-0 w-8 pt-2 text-[13px] font-medium text-content-subtle">
                {index + 1}
              </div>

              {/* Card Content */}
              <div className="flex-1 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-content-subtle mb-1">
                    Terme
                  </label>
                  <RichTextEditor
                    id={`front-${card.id}`}
                    value={card.front || ''}
                    onChange={(value) => handleUpdateCard(card.id, 'front', value)}
                    placeholder="Entrez le terme..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-content-subtle mb-1">
                    Définition
                  </label>
                  <RichTextEditor
                    id={`back-${card.id}`}
                    value={card.back || ''}
                    onChange={(value) => handleUpdateCard(card.id, 'back', value)}
                    placeholder="Entrez la définition..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-start gap-2 pt-2">
                <button
                  onClick={() => {
                    // Image button - placeholder for future image upload
                    alert(t('imageUploadComingSoon'));
                  }}
                  className="p-2 text-content-subtle hover:text-content-muted transition-colors"
                  title={t('addImage')}
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-2 text-content-subtle hover:text-state-danger transition-colors"
                  title="Delete card"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Card>
          </div>
          
          {/* Add Card Button (appears on hover) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={() => handleAddCard(index)}
              className="rounded-full bg-brand-primary p-2 text-content-inverted shadow-lg transition-colors hover:bg-brand-primaryDark"
              title={t('addCardBelow')}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          </div>
        ))}
      </div>

      {/* Add Card Button */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => handleAddCard()}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addCard')}
        </Button>
      </div>

      {/* Save Button */}
      <div className="flex justify-between items-center pt-4 border-t">
        {hasUnsavedChanges && (
          <p className="text-[13px] text-state-warning">{t('unsavedChanges')}</p>
        )}
        <div className="flex justify-end space-x-4 ml-auto">
          <Button variant="outline" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
            {isSaving ? t('saving') : t('save')}
          </Button>
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </>
  );
}

