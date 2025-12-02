'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, Plus, Play } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';
import { createSetAndRedirect } from '@/lib/utils/createSetAndRedirect';

type Set = Database['public']['Tables']['sets']['Row'];

export default function DashboardPage() {
  const router = useRouter();
  const [sets, setSets] = useState<Set[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSet, setIsCreatingSet] = useState(false);

  useEffect(() => {
    loadSets();
  }, []);

  const loadSets = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const { data: setsData, error } = await supabaseBrowser
        .from('sets')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load sets:', error);
        return;
      }

      setSets((setsData || []) as Set[]);
    } catch (error) {
      console.error('Failed to load sets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSet = async () => {
    setIsCreatingSet(true);
    try {
      const setId = await createSetAndRedirect();
      router.push(`/sets/${setId}/edit`);
    } catch (error) {
      console.error('Failed to create set:', error);
      alert('Failed to create set. Please try again.');
    } finally {
      setIsCreatingSet(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-white">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mes Cardz</h1>
          <p className="text-dark-text-secondary">
            Gérez vos sets de flashcards
          </p>
        </div>
        <Button
          onClick={handleCreateSet}
          disabled={isCreatingSet}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isCreatingSet ? 'Création...' : 'Créer un set'}
        </Button>
      </div>

      {/* Sets Grid */}
      {sets.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 text-dark-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Aucun set pour le moment</h2>
          <p className="text-dark-text-secondary mb-6">
            Créez votre premier set de flashcards pour commencer à étudier
          </p>
          <Button onClick={handleCreateSet} disabled={isCreatingSet}>
            <Plus className="h-4 w-4 mr-2" />
            {isCreatingSet ? 'Création...' : 'Créer mon premier set'}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((set) => (
            <Card key={set.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link href={`/sets/${set.id}`}>
                    <h3 className="text-lg font-semibold text-white mb-2 hover:text-brand-primary transition-colors">
                      {set.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-dark-text-secondary line-clamp-2 mb-4">
                    {set.description || 'Aucune description'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-dark-text-muted mb-4">
                <span>{new Date(set.created_at).toLocaleDateString('fr-FR')}</span>
                <div className="flex items-center gap-2">
                  {set.is_public && (
                    <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded text-[11px]">
                      Public
                    </span>
                  )}
                  {set.tags && set.tags.length > 0 && (
                    <span className="px-2 py-1 bg-dark-background-cardMuted rounded text-[11px]">
                      {set.tags[0]}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/sets/${set.id}`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    Voir
                  </Button>
                </Link>
                <Link href={`/study/${set.id}`} className="flex-1">
                  <Button className="w-full" size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Étudier
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
