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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Share cookies across subdomains (shop.cardz.dev, app.cardz.dev)
const getCookieDomain = () => {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname;
  return hostname.endsWith('.cardz.dev') || hostname === 'cardz.dev'
    ? '.cardz.dev'
    : undefined;
};

/**
 * Instance unique du client Supabase pour le navigateur
 * 
 * Cette instance partage la même session (via cookies) pour tous les composants 
 * et services côté client.
 */
export const supabaseBrowser = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  isSingleton: true,
  cookieOptions: {
    domain: getCookieDomain(),
    path: '/',
    sameSite: 'lax',
    secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  },
});
