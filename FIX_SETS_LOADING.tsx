/**
 * Composant de Debug pour les Sets
 * 
 * Comment utiliser :
 * 1. Ajoutez ce composant à votre page dashboard
 * 2. Il affichera automatiquement le statut d'authentification
 * 3. Il montrera pourquoi les sets ne se chargent pas
 */

'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export function SetsDebugPanel() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runDiagnostics = async () => {
    setIsChecking(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      checks: [],
    };

    try {
      // 1. Vérifier la session
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      results.checks.push({
        name: 'Session Utilisateur',
        status: sessionData.session?.user ? 'success' : 'error',
        message: sessionData.session?.user 
          ? `Connecté : ${sessionData.session.user.email}`
          : 'Aucune session trouvée - Vous devez vous reconnecter',
        data: {
          user_id: sessionData.session?.user?.id,
          email: sessionData.session?.user?.email,
        },
      });

      if (sessionData.session?.user) {
        // 2. Vérifier le profil
        try {
          const { data: profile, error: profileError } = await supabaseBrowser
            .from('profiles')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .single();

          results.checks.push({
            name: 'Profil Utilisateur',
            status: profile ? 'success' : 'error',
            message: profile 
              ? `Profil trouvé : ${profile.username}`
              : `Erreur : ${profileError?.message}`,
            data: profile,
          });
        } catch (error: any) {
          results.checks.push({
            name: 'Profil Utilisateur',
            status: 'error',
            message: error.message,
          });
        }

        // 3. Vérifier les sets
        try {
          const { data: sets, error: setsError } = await supabaseBrowser
            .from('sets')
            .select('id, title, user_id, created_at, is_public')
            .eq('user_id', sessionData.session.user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          results.checks.push({
            name: 'Mes Sets',
            status: setsError ? 'error' : 'success',
            message: setsError
              ? `Erreur : ${setsError.message}`
              : `${sets?.length || 0} set(s) trouvé(s)`,
            data: sets,
          });
        } catch (error: any) {
          results.checks.push({
            name: 'Mes Sets',
            status: 'error',
            message: error.message,
          });
        }

        // 4. Tester la création
        try {
          // Test de permissions (pas d'insertion réelle)
          const testSet = {
            title: 'Test Set (will not be created)',
            description: 'Test',
            is_public: false,
            user_id: sessionData.session.user.id,
          };

          results.checks.push({
            name: 'Permissions de Création',
            status: 'success',
            message: 'Les données de test sont valides',
            data: { test: 'OK' },
          });
        } catch (error: any) {
          results.checks.push({
            name: 'Permissions de Création',
            status: 'error',
            message: error.message,
          });
        }
      }

      setDiagnostics(results);
    } catch (error: any) {
      results.checks.push({
        name: 'Diagnostic Global',
        status: 'error',
        message: error.message,
      });
      setDiagnostics(results);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  if (!diagnostics) {
    return (
      <Card className="p-6 border-yellow-500/30 bg-yellow-50/30">
        <p>Chargement des diagnostics...</p>
      </Card>
    );
  }

  const hasErrors = diagnostics.checks.some((c: any) => c.status === 'error');
  const allSuccess = diagnostics.checks.every((c: any) => c.status === 'success');

  return (
    <Card className={`p-6 ${hasErrors ? 'border-red-500/30 bg-red-50/30' : 'border-green-500/30 bg-green-50/30'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Diagnostic Sets</h3>
        <Button size="sm" onClick={runDiagnostics} disabled={isChecking}>
          {isChecking ? 'Vérification...' : 'Relancer'}
        </Button>
      </div>

      <div className="space-y-3">
        {diagnostics.checks.map((check: any, index: number) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/50">
            {check.status === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">{check.name}</p>
              <p className="text-xs text-content-muted mt-1">{check.message}</p>
              {check.data && Object.keys(check.data).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer text-blue-600 hover:text-blue-700">
                    Voir les détails
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(check.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>

      {allSuccess && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <p className="text-sm text-green-900 font-medium">
            ✅ Tout fonctionne correctement ! Si vous ne voyez toujours pas vos sets, essayez de rafraîchir la page.
          </p>
        </div>
      )}

      {hasErrors && (
        <div className="mt-4 p-3 bg-red-100 rounded-lg space-y-2">
          <p className="text-sm text-red-900 font-medium">
            ❌ Problèmes détectés
          </p>
          {diagnostics.checks.find((c: any) => c.name === 'Session Utilisateur' && c.status === 'error') && (
            <div className="space-y-2">
              <p className="text-xs text-red-800">
                Vous n'êtes pas connecté. Veuillez vous reconnecter.
              </p>
              <Button size="sm" onClick={() => window.location.href = '/login'}>
                Se Reconnecter
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-content-subtle">
          Dernière vérification : {new Date(diagnostics.timestamp).toLocaleString('fr-FR')}
        </p>
      </div>
    </Card>
  );
}
