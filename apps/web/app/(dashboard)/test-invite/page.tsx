'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { friendsService } from '@/lib/supabase/friends';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function TestInvitePage() {
  const { user } = useAuthStore();
  const [inviteCode, setInviteCode] = useState('');
  const [testLog, setTestLog] = useState<string[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const log = `[${timestamp}] ${prefix} ${message}`;
    console.log(log);
    setTestLog(prev => [...prev, log]);
  };

  const clearLog = () => {
    setTestLog([]);
  };

  const testInviteCodeLookup = async () => {
    if (!inviteCode) {
      alert('Entre un code d\'invitation d\'abord');
      return;
    }

    clearLog();
    addLog('🔍 Test de recherche du code d\'invitation...');
    
    try {
      const { data, error } = await (supabaseBrowser
        .from('invitation_codes') as any)
        .select('*')
        .eq('code', inviteCode)
        .single();

      if (error) {
        addLog(`Erreur lors de la recherche: ${error.message}`, 'error');
        addLog(`Code erreur: ${error.code}`, 'error');
        addLog(`Détails: ${JSON.stringify(error)}`, 'error');
      } else if (!data) {
        addLog('Code non trouvé dans la base de données', 'error');
      } else {
        addLog('Code trouvé !', 'success');
        addLog(`Inviter ID: ${data.inviter_id}`, 'info');
        addLog(`Créé le: ${new Date(data.created_at).toLocaleString('fr-FR')}`, 'info');
        addLog(`Expire le: ${new Date(data.expires_at).toLocaleString('fr-FR')}`, 'info');
        addLog(`Utilisations: ${data.uses_count}/${data.max_uses}`, 'info');
        
        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          addLog('⚠️ ATTENTION: Code expiré !', 'error');
        } else {
          addLog('Code valide et non expiré', 'success');
        }

        // Check if max uses reached
        if (data.uses_count >= data.max_uses) {
          addLog('⚠️ ATTENTION: Nombre maximum d\'utilisations atteint !', 'error');
        } else {
          addLog(`Utilisations restantes: ${data.max_uses - data.uses_count}`, 'success');
        }
      }
    } catch (err: any) {
      addLog(`Exception: ${err.message}`, 'error');
    }
  };

  const testUseInviteCode = async () => {
    if (!inviteCode) {
      alert('Entre un code d\'invitation d\'abord');
      return;
    }

    if (!user) {
      alert('Tu dois être connecté pour tester l\'utilisation du code');
      return;
    }

    clearLog();
    addLog('🎯 Test d\'utilisation du code d\'invitation...');
    addLog(`User ID: ${user.id}`, 'info');
    addLog(`Code: ${inviteCode}`, 'info');

    try {
      await friendsService.useInviteCode(inviteCode, user.id);
      addLog('✨ Code utilisé avec succès ! Amitié créée !', 'success');
      addLog('Vérifie ton profil pour voir ton nouvel ami', 'success');
    } catch (err: any) {
      addLog(`Erreur lors de l'utilisation du code: ${err.message}`, 'error');
      addLog(`Stack: ${err.stack}`, 'error');
    }
  };

  const testCheckFriendships = async () => {
    if (!user) {
      alert('Tu dois être connecté');
      return;
    }

    clearLog();
    addLog('👥 Vérification des amitiés existantes...');

    try {
      const { data, error } = await (supabaseBrowser
        .from('friendships') as any)
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        addLog(`Erreur: ${error.message}`, 'error');
      } else {
        addLog(`Nombre d'amitiés trouvées: ${data?.length || 0}`, 'info');
        if (data && data.length > 0) {
          data.forEach((friendship: any, idx: number) => {
            addLog(`Ami ${idx + 1}:`, 'info');
            addLog(`  - Friend ID: ${friendship.friend_id}`, 'info');
            addLog(`  - Créé le: ${new Date(friendship.created_at).toLocaleString('fr-FR')}`, 'info');
            addLog(`  - Via code: ${friendship.invited_via_code || 'N/A'}`, 'info');
          });
        }
      }
    } catch (err: any) {
      addLog(`Exception: ${err.message}`, 'error');
    }
  };

  const testGetMyFriends = async () => {
    clearLog();
    addLog('📋 Test de getMyFriends()...');

    try {
      const friends = await friendsService.getMyFriends();
      addLog(`Nombre d'amis retournés: ${friends.length}`, friends.length > 0 ? 'success' : 'info');
      
      if (friends.length > 0) {
        friends.forEach((friend, idx) => {
          addLog(`Ami ${idx + 1}:`, 'info');
          addLog(`  - Username: ${friend.username}`, 'info');
          addLog(`  - ID: ${friend.id}`, 'info');
          addLog(`  - Ami depuis: ${new Date(friend.created_at).toLocaleString('fr-FR')}`, 'info');
        });
      } else {
        addLog('Aucun ami trouvé', 'info');
      }
    } catch (err: any) {
      addLog(`Erreur: ${err.message}`, 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2">🧪 Test - Système d'invitation</h1>
        <p className="text-content-muted mb-4">
          Cette page te permet de tester chaque étape du système d'invitation
        </p>
      </div>

      {user && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-800">
            ✅ Connecté en tant que: <span className="font-mono font-bold">{user.email}</span>
          </p>
          <p className="text-xs text-green-700 mt-1">
            User ID: <span className="font-mono">{user.id}</span>
          </p>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="font-semibold mb-4">1️⃣ Entre un code d'invitation</h2>
        <div className="flex gap-2">
          <Input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Ex: ABC123XY"
            className="font-mono uppercase"
          />
        </div>
        <p className="text-xs text-content-muted mt-2">
          Tu peux générer un code sur la page <a href="/debug-friends" className="text-blue-600 underline">/debug-friends</a>
        </p>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold mb-4">2️⃣ Tests disponibles</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={testInviteCodeLookup} variant="outline" className="w-full">
            🔍 Rechercher le code
          </Button>
          <Button onClick={testUseInviteCode} className="w-full bg-blue-600 hover:bg-blue-700">
            🎯 Utiliser le code
          </Button>
          <Button onClick={testCheckFriendships} variant="outline" className="w-full">
            👥 Mes amitiés (raw)
          </Button>
          <Button onClick={testGetMyFriends} className="w-full bg-green-600 hover:bg-green-700">
            📋 getMyFriends()
          </Button>
        </div>

        <div className="pt-3 border-t">
          <Button onClick={clearLog} variant="outline" size="sm" className="text-xs">
            Effacer les logs
          </Button>
        </div>
      </Card>

      {testLog.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            📝 Logs de test
            <span className="text-xs text-content-muted">({testLog.length} entrées)</span>
          </h3>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96 space-y-1">
            {testLog.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap break-all">
                {log}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Comment utiliser cette page</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>
            <strong>Génère un code</strong> : Va sur <a href="/debug-friends" className="underline">/debug-friends</a> et clique sur "Test complet du flux"
          </li>
          <li>
            <strong>Copie le code</strong> : Le code sera affiché et copié dans ton presse-papier
          </li>
          <li>
            <strong>Reviens ici</strong> : Colle le code dans le champ ci-dessus
          </li>
          <li>
            <strong>Teste chaque étape</strong> :
            <ul className="ml-6 mt-1 space-y-1 list-disc">
              <li>"Rechercher le code" : Vérifie que le code existe dans la DB</li>
              <li>"Utiliser le code" : Crée l'amitié (simule l'inscription)</li>
              <li>"Mes amitiés (raw)" : Vérifie les données brutes dans la table friendships</li>
              <li>"getMyFriends()" : Teste la fonction du service qui retourne les amis</li>
            </ul>
          </li>
          <li>
            <strong>Vérifie les logs</strong> : Tous les détails apparaissent dans la console du navigateur (F12) et dans les logs ci-dessous
          </li>
        </ol>
      </Card>
    </div>
  );
}
