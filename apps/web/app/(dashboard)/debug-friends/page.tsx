'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { friendsService } from '@/lib/supabase/friends';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DebugFriendsPage() {
  const { user, profile } = useAuthStore();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDebugInfo();
    }
  }, [user]);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      const info: any = {
        user: {
          id: user?.id,
          email: user?.email,
        },
        profile: {
          id: profile?.id,
          username: profile?.username,
        },
        tables: {},
        friends: [],
        inviteCodes: [],
        errors: [],
      };

      // Check if invitation_codes table exists
      try {
        const { data: codes, error: codesError } = await (supabaseBrowser
          .from('invitation_codes') as any)
          .select('*')
          .limit(5);
        
        if (codesError) {
          info.tables.invitation_codes = 'ERROR: ' + codesError.message;
          info.errors.push({ table: 'invitation_codes', error: codesError.message });
        } else {
          info.tables.invitation_codes = 'EXISTS';
          info.inviteCodes = codes || [];
        }
      } catch (e: any) {
        info.tables.invitation_codes = 'DOES NOT EXIST';
        info.errors.push({ table: 'invitation_codes', error: e.message });
      }

      // Check if friendships table exists
      try {
        const { data: friendships, error: friendshipsError } = await (supabaseBrowser
          .from('friendships') as any)
          .select('*')
          .eq('user_id', user?.id);
        
        if (friendshipsError) {
          info.tables.friendships = 'ERROR: ' + friendshipsError.message;
          info.errors.push({ table: 'friendships', error: friendshipsError.message });
        } else {
          info.tables.friendships = 'EXISTS';
          info.friends = friendships || [];
        }
      } catch (e: any) {
        info.tables.friendships = 'DOES NOT EXIST';
        info.errors.push({ table: 'friendships', error: e.message });
      }

      // Try to use friends service
      try {
        const friendsList = await friendsService.getMyFriends();
        info.friendsFromService = friendsList;
      } catch (e: any) {
        info.friendsServiceError = e.message;
      }

      try {
        const friendCount = await friendsService.getFriendCount();
        info.friendCountFromService = friendCount;
      } catch (e: any) {
        info.friendCountServiceError = e.message;
      }

      setDebugInfo(info);
    } catch (error: any) {
      setDebugInfo({ globalError: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGenerateCode = async () => {
    try {
      console.log('[Debug] Starting code generation...');
      const code = await friendsService.generateInviteCode();
      console.log('[Debug] Code generated successfully:', code);
      const link = friendsService.getInviteLink(code.code);
      console.log('[Debug] Invite link:', link);
      
      alert(`Code généré: ${code.code}\nLien: ${link}\n\n✅ Vérifie la console pour les détails`);
      await loadDebugInfo();
    } catch (error: any) {
      console.error('[Debug] Failed to generate code:', error);
      alert('Erreur: ' + error.message + '\n\nVérifie la console pour les détails');
    }
  };

  const testFullFlow = async () => {
    try {
      console.log('[Debug] ===== STARTING FULL INVITATION FLOW TEST =====');
      
      // Step 1: Generate code
      console.log('[Debug] Step 1: Generating invite code...');
      const code = await friendsService.generateInviteCode();
      console.log('[Debug] ✅ Code generated:', code);
      
      // Step 2: Get link
      const link = friendsService.getInviteLink(code.code);
      console.log('[Debug] ✅ Link created:', link);
      
      // Step 3: Copy to clipboard
      await navigator.clipboard.writeText(link);
      console.log('[Debug] ✅ Link copied to clipboard');
      
      alert(`✅ TEST RÉUSSI !\n\n` +
            `Code: ${code.code}\n` +
            `Lien copié dans le presse-papier\n\n` +
            `PROCHAINES ÉTAPES:\n` +
            `1. Ouvre une fenêtre de navigation privée\n` +
            `2. Colle le lien (${link})\n` +
            `3. Crée un nouveau compte\n` +
            `4. Reviens ici et clique sur "Rafraîchir"\n` +
            `5. Tu devrais voir le nouvel ami !\n\n` +
            `📝 Vérifie la console pour les logs détaillés`);
      
      await loadDebugInfo();
    } catch (error: any) {
      console.error('[Debug] ===== FULL FLOW TEST FAILED =====', error);
      alert('❌ ERREUR: ' + error.message + '\n\nVérifie la console pour les détails');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Chargement des informations de debug...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Debug - Système d'amis</h1>
        <p className="text-content-muted mb-4">
          Cette page affiche toutes les informations sur le système d'amis
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={loadDebugInfo}>Rafraîchir</Button>
          <Button onClick={testGenerateCode} variant="outline">
            Générer un code
          </Button>
          <Button onClick={testFullFlow} className="bg-green-600 hover:bg-green-700">
            🧪 Test complet du flux
          </Button>
        </div>
      </div>

      {debugInfo.globalError ? (
        <Card className="p-4 bg-red-50 border-red-200">
          <h2 className="font-semibold text-red-700">Erreur globale</h2>
          <p className="text-red-600">{debugInfo.globalError}</p>
        </Card>
      ) : (
        <>
          {/* User Info */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">👤 Utilisateur connecté</h2>
            <pre className="bg-bg-subtle p-3 rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo.user, null, 2)}
            </pre>
            <pre className="bg-bg-subtle p-3 rounded text-xs overflow-auto mt-2">
              {JSON.stringify(debugInfo.profile, null, 2)}
            </pre>
          </Card>

          {/* Tables Status */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">🗄️ État des tables</h2>
            {Object.entries(debugInfo.tables || {}).map(([table, status]) => (
              <div key={table} className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm">{table}:</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    status === 'EXISTS'
                      ? 'bg-green-100 text-green-700'
                      : status === 'DOES NOT EXIST'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {status as string}
                </span>
              </div>
            ))}
          </Card>

          {/* Errors */}
          {debugInfo.errors && debugInfo.errors.length > 0 && (
            <Card className="p-4 bg-red-50 border-red-200">
              <h2 className="font-semibold text-red-700 mb-3">❌ Erreurs détectées</h2>
              {debugInfo.errors.map((err: any, idx: number) => (
                <div key={idx} className="mb-2">
                  <p className="font-mono text-sm text-red-600">{err.table}:</p>
                  <p className="text-xs text-red-500 ml-4">{err.error}</p>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  ⚠️ Les tables n'existent pas !
                </p>
                <p className="text-xs text-yellow-700 mb-3">
                  Tu dois appliquer la migration SQL pour créer les tables du système d'amis.
                </p>
                <ol className="text-xs text-yellow-700 list-decimal list-inside space-y-1">
                  <li>Va sur ton dashboard Supabase</li>
                  <li>Clique sur "SQL Editor"</li>
                  <li>Copie le contenu de <code className="bg-yellow-100 px-1 rounded">supabase/add_friends_system.sql</code></li>
                  <li>Colle-le dans l'éditeur SQL</li>
                  <li>Exécute la requête (RUN)</li>
                </ol>
              </div>
            </Card>
          )}

          {/* Invite Codes */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">🎟️ Codes d'invitation ({debugInfo.inviteCodes?.length || 0})</h2>
            {debugInfo.inviteCodes && debugInfo.inviteCodes.length > 0 ? (
              <pre className="bg-bg-subtle p-3 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo.inviteCodes, null, 2)}
              </pre>
            ) : (
              <p className="text-content-muted text-sm">Aucun code d'invitation trouvé</p>
            )}
          </Card>

          {/* Friendships */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">👥 Relations d'amitié ({debugInfo.friends?.length || 0})</h2>
            {debugInfo.friends && debugInfo.friends.length > 0 ? (
              <pre className="bg-bg-subtle p-3 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo.friends, null, 2)}
              </pre>
            ) : (
              <p className="text-content-muted text-sm">Aucune relation d'amitié trouvée</p>
            )}
          </Card>

          {/* Friends Service */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">🔧 Service Friends</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">getMyFriends():</p>
                {debugInfo.friendsServiceError ? (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    ❌ {debugInfo.friendsServiceError}
                  </p>
                ) : (
                  <pre className="bg-bg-subtle p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(debugInfo.friendsFromService, null, 2)}
                  </pre>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-1">getFriendCount():</p>
                {debugInfo.friendCountServiceError ? (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    ❌ {debugInfo.friendCountServiceError}
                  </p>
                ) : (
                  <p className="text-lg font-bold text-brand-primary">
                    {debugInfo.friendCountFromService}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
