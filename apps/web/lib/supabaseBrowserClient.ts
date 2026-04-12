'use client';

/**
 * Client Supabase unique pour le navigateur
 * 
 * Utilise @supabase/ssr pour assurer la persistance de la session
 * avec des cookies de manière partagée avec le serveur.
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

// Share cookies across subdomains (shop.cardz.dev, app.cardz.dev)
const getCookieDomain = () => {
  if (typeof window !== 'undefined') {
    const isProduction = window.location.hostname.endsWith('.cardz.dev') || window.location.hostname === 'cardz.dev';
    return isProduction ? '.cardz.dev' : undefined;
  }
  return undefined;
};

/**
 * Instance unique du client Supabase pour le navigateur
 * 
 * Cette instance partage la même session (via cookies) pour tous les composants 
 * et services côté client.
 */
export const supabaseBrowser = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    domain: getCookieDomain(),
  },
});
