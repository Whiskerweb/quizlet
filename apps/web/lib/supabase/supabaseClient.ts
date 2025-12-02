/**
 * Client Supabase standard pour l'authentification OAuth
 * 
 * Ce fichier crée un client Supabase configuré avec les variables d'environnement
 * NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * 
 * Ce client est utilisé spécifiquement pour l'authentification OAuth (Google, etc.)
 * car il nécessite un client standard plutôt que le client SSR.
 * 
 * Variables d'environnement requises :
 * - NEXT_PUBLIC_SUPABASE_URL : L'URL de votre projet Supabase
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY : La clé anonyme (publique) de votre projet Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement
// Ces variables doivent être définies dans votre fichier .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vérification que les variables d'environnement sont définies
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

/**
 * Client Supabase configuré pour l'authentification OAuth
 * 
 * Ce client est utilisé pour :
 * - L'authentification OAuth (Google, GitHub, etc.)
 * - Les opérations côté client qui nécessitent un client standard
 * 
 * Note : Pour les opérations serveur, utilisez le client SSR dans lib/supabase/client.ts
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configuration pour l'authentification OAuth
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});



