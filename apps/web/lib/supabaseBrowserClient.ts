'use client';

/**
 * Client Supabase unique pour le navigateur
 * 
 * Ce fichier exporte une seule instance de client Supabase pour tout le front.
 * Cela évite les problèmes de "Multiple GoTrueClient instances detected".
 * 
 * IMPORTANT : Tous les composants client doivent utiliser cette instance unique.
 * Ne créez pas d'autres instances avec createClient() côté navigateur.
 */

import { createClient } from '@supabase/supabase-js';

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
 * - persistSession: true → La session est sauvegardée dans localStorage
 * - detectSessionInUrl: true → Détecte automatiquement le hash fragment OAuth (#access_token=...)
 */
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});

