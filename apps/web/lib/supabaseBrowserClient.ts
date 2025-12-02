'use client';

/**
 * Client Supabase unique pour le navigateur
 * 
 * Ce fichier exporte une seule instance de client Supabase pour tout le front.
 * Cela évite les problèmes de "Multiple GoTrueClient instances detected".
 * 
 * IMPORTANT : Tous les composants client et services doivent utiliser cette instance unique.
 * Ne créez pas d'autres instances avec createClient() côté navigateur.
 * 
 * Pour les opérations serveur (API routes, Server Components), utilisez lib/supabase/server.ts
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

/**
 * Instance unique du client Supabase pour le navigateur
 * 
 * Configuration :
 * - La session est automatiquement gérée par @supabase/ssr
 * - Détecte automatiquement le hash fragment OAuth (#access_token=...)
 * - Rafraîchit automatiquement le token
 * 
 * Cette instance partage la même session pour tous les composants et services côté client.
 */
export const supabaseBrowser = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

