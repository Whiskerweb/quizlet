'use client';

import { useState, useEffect, useCallback } from 'react';
import { parseImportedText, type ParsedCard } from '@/lib/utils/parseImportedText';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { X } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (cards: ParsedCard[]) => void;
}

type TermSeparator = 'Tab' | 'Virgule' | 'Personnalisé';
type CardSeparator = 'Nouvelle ligne' | 'Point-virgule' | 'Personnalisé';

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [text, setText] = useState('');
  const [termSeparator, setTermSeparator] = useState<TermSeparator>('Tab');
  const [customTermSeparator, setCustomTermSeparator] = useState('');
  const [cardSeparator, setCardSeparator] = useState<CardSeparator>('Nouvelle ligne');
  const [customCardSeparator, setCustomCardSeparator] = useState('');
  const [parsedResult, setParsedResult] = useState<{ cards: ParsedCard[]; errors: string[] }>({
    cards: [],
    errors: [],
  });

  // Debounced parsing
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const actualTermSeparator = termSeparator === 'Personnalisé' ? customTermSeparator : termSeparator;
      const actualCardSeparator = cardSeparator === 'Personnalisé' ? customCardSeparator : cardSeparator;

      if (!text.trim()) {
        setParsedResult({ cards: [], errors: [] });
        return;
      }

      const result = parseImportedText(text, actualTermSeparator, actualCardSeparator);
      setParsedResult(result);
    }, 200);

    return () => clearTimeout(timer);
  }, [text, termSeparator, customTermSeparator, cardSeparator, customCardSeparator, isOpen]);

  const handleImport = () => {
    if (parsedResult.cards.length > 0) {
      onImport(parsedResult.cards);
      // Reset form
      setText('');
      setTermSeparator('Tab');
      setCardSeparator('Nouvelle ligne');
      setCustomTermSeparator('');
      setCustomCardSeparator('');
      onClose();
    }
  };

  if (!isOpen) return null;

  const actualTermSeparator = termSeparator === 'Personnalisé' ? customTermSeparator : termSeparator;
  const actualCardSeparator = cardSeparator === 'Personnalisé' ? customCardSeparator : cardSeparator;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Importer des cartes</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collez vos données ici
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Collez vos données ici"
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white resize-none font-mono text-sm"
            />
          </div>

          {/* Separators */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Term Separator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Séparateur entre le terme et la définition
              </label>
              <div className="space-y-2">
                {(['Tab', 'Virgule', 'Personnalisé'] as TermSeparator[]).map((option) => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="termSeparator"
                      value={option}
                      checked={termSeparator === option}
                      onChange={(e) => setTermSeparator(e.target.value as TermSeparator)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
                {termSeparator === 'Personnalisé' && (
                  <input
                    type="text"
                    value={customTermSeparator}
                    onChange={(e) => setCustomTermSeparator(e.target.value)}
                    placeholder="Séparateur personnalisé"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white text-sm"
                  />
                )}
              </div>
            </div>

            {/* Card Separator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Séparateur entre les cartes
              </label>
              <div className="space-y-2">
                {(['Nouvelle ligne', 'Point-virgule', 'Personnalisé'] as CardSeparator[]).map((option) => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cardSeparator"
                      value={option}
                      checked={cardSeparator === option}
                      onChange={(e) => setCardSeparator(e.target.value as CardSeparator)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
                {cardSeparator === 'Personnalisé' && (
                  <input
                    type="text"
                    value={customCardSeparator}
                    onChange={(e) => setCustomCardSeparator(e.target.value)}
                    placeholder="Séparateur personnalisé"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white text-sm"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Aperçu : {parsedResult.cards.length} {parsedResult.cards.length === 1 ? 'carte' : 'cartes'}
            </h3>
            {parsedResult.cards.length === 0 && parsedResult.errors.length === 0 && !text.trim() ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-500">Rien à visualiser pour l'instant</p>
              </div>
            ) : (
              <div className="space-y-4">
                {parsedResult.cards.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <ol className="space-y-3">
                      {parsedResult.cards.map((card, index) => (
                        <li key={index} className="flex gap-4 text-sm">
                          <div className="flex-shrink-0 w-8 text-gray-500 font-medium">
                            {index + 1}.
                          </div>
                          <div className="flex-1 grid md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-gray-500 uppercase">Terme</span>
                              <p className="text-gray-900 font-medium mt-1">{card.term}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 uppercase">Définition</span>
                              <p className="text-gray-700 mt-1">{card.definition}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {parsedResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-red-800 mb-2">Erreurs détectées :</h4>
                    <ul className="space-y-1">
                      {parsedResult.errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedResult.cards.length === 0}
          >
            Importer
          </Button>
        </div>
      </div>
    </div>
  );
}



