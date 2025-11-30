'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { setsService } from '@/lib/supabase/sets';
import { flashcardsService } from '@/lib/supabase/flashcards';
import type { SetWithFlashcards } from '@/lib/supabase/sets';
import type { ParsedCard } from '@/lib/utils/parseImportedText';
import { ImportModal } from '@/components/ImportModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
  const setId = params.id as string;
  const [set, setSet] = useState<SetWithFlashcards | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    loadSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const loadSet = async () => {
    try {
      setIsLoading(true);
      const data = await setsService.getOne(setId);
      setSet(data);
      setFlashcards(
        (data.flashcards || []).map((card) => ({
          id: card.id,
          front: card.front,
          back: card.back,
          imageUrl: card.image_url || null,
        }))
      );
    } catch (error) {
      console.error('Failed to load set:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = () => {
    setFlashcards([
      ...flashcards,
      {
        id: `temp-${Date.now()}`,
        front: '',
        back: '',
        imageUrl: null,
      },
    ]);
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    // If it's a temporary card (starts with "temp-"), just remove it from state
    if (id.startsWith('temp-')) {
      setFlashcards(flashcards.filter((card) => card.id !== id));
      return;
    }

    try {
      await flashcardsService.delete(id);
      setFlashcards(flashcards.filter((card) => card.id !== id));
    } catch (error) {
      console.error('Failed to delete flashcard:', error);
      alert('Failed to delete flashcard');
    }
  };

  const handleUpdateCard = (id: string, field: 'front' | 'back', value: string) => {
    setFlashcards(
      flashcards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save all flashcards
      for (const card of flashcards) {
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
        }
      }

      // Reload to get updated data
      await loadSet();
      alert('Flashcards saved successfully!');
    } catch (error) {
      console.error('Failed to save flashcards:', error);
      alert('Failed to save flashcards');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = async (cards: ParsedCard[]) => {
    try {
      await flashcardsService.import(setId, cards);
      await loadSet();
    } catch (error) {
      console.error('Failed to import flashcards:', error);
      alert('Failed to import flashcards');
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
        <p>Set not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Set: {set.title}</h1>
        <p className="text-gray-600">Manage your flashcards</p>
      </div>

      {/* Import Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Flashcards</h2>
          <p className="text-sm text-gray-600">Gérez vos cartes ou importez-les en masse</p>
        </div>
        <Button onClick={() => setIsImportModalOpen(true)}>
          Importer
        </Button>
      </div>

      {/* Flashcards List */}
      <div className="space-y-4 mb-6">
        {flashcards.map((card, index) => (
          <Card key={card.id} className="p-4">
            <div className="flex items-start gap-4">
              {/* Drag Handle */}
              <div className="flex-shrink-0 pt-2 cursor-move text-gray-400 hover:text-gray-600">
                <GripVertical className="h-5 w-5" />
              </div>

              {/* Card Number */}
              <div className="flex-shrink-0 w-8 pt-2 text-sm font-medium text-gray-500">
                {index + 1}
              </div>

              {/* Card Content */}
              <div className="flex-1 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Term
                  </label>
                  <textarea
                    value={card.front}
                    onChange={(e) => handleUpdateCard(card.id, 'front', e.target.value)}
                    placeholder="Enter term..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Definition
                  </label>
                  <textarea
                    value={card.back}
                    onChange={(e) => handleUpdateCard(card.id, 'back', e.target.value)}
                    placeholder="Enter definition..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-start gap-2 pt-2">
                <button
                  onClick={() => {
                    // Image button - placeholder for future image upload
                    alert('Image upload coming soon');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Add image"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete card"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Card Button */}
      <div className="mb-6">
        <Button variant="outline" onClick={handleAddCard}>
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}

