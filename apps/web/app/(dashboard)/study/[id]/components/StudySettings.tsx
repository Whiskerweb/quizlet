'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Shuffle, Play, ArrowLeft } from 'lucide-react';

interface StudySettingsProps {
  totalCards: number;
  onStart: (options: { shuffle: boolean; startFrom: number }) => void;
  onCancel: () => void;
}

export function StudySettings({ totalCards, onStart, onCancel }: StudySettingsProps) {
  const [shuffle, setShuffle] = useState(false);
  const [startFrom, setStartFrom] = useState(1);
  const [useStartFrom, setUseStartFrom] = useState(false);

  const handleStart = () => {
    onStart({
      shuffle: shuffle && !useStartFrom,
      startFrom: useStartFrom ? startFrom : 1,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-background-base">
      <Card className="max-w-md w-full p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Paramètres de révision</h2>
        
        <div className="space-y-6">
          {/* Shuffle option */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => {
                  setShuffle(e.target.checked);
                  if (e.target.checked) {
                    setUseStartFrom(false);
                  }
                }}
                disabled={useStartFrom}
                className="w-5 h-5 rounded border-gray-600 bg-dark-background-input text-brand-primary focus:ring-brand-primary focus:ring-2"
              />
              <div className="flex items-center space-x-2">
                <Shuffle className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Mélanger les cartes</span>
              </div>
            </label>
            <p className="text-sm text-dark-text-muted mt-2 ml-8">
              Les cartes seront mélangées aléatoirement pour cette session uniquement
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-[rgba(255,255,255,0.06)]"></div>

          {/* Start from option */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={useStartFrom}
                onChange={(e) => {
                  setUseStartFrom(e.target.checked);
                  if (e.target.checked) {
                    setShuffle(false);
                  }
                }}
                className="w-5 h-5 rounded border-gray-600 bg-dark-background-input text-brand-primary focus:ring-brand-primary focus:ring-2"
              />
              <span className="text-white font-medium">Commencer à partir d'une carte spécifique</span>
            </label>
            
            {useStartFrom && (
              <div className="ml-8 mt-3">
                <label className="block text-sm text-dark-text-muted mb-2">
                  Carte de départ (1 - {totalCards})
                </label>
                <input
                  type="number"
                  min="1"
                  max={totalCards}
                  value={startFrom}
                  onChange={(e) => {
                    const value = Math.max(1, Math.min(totalCards, parseInt(e.target.value) || 1));
                    setStartFrom(value);
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-dark-background-input border border-[rgba(255,255,255,0.12)] text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <p className="text-xs text-dark-text-muted mt-2">
                  Vous commencerez à la carte {startFrom} sur {totalCards}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleStart}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Lancer
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}



