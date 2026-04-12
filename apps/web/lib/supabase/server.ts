import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

/**
 * Client Supabase pour le serveur (Server Components, Route Handlers, Actions)
 * 
 * Assure la persistance de la session via les cookies, avec le domaine partagé
 * .cardz.dev pour permettre la navigation entre sous-domaines.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  const cookieStore = await cookies();
  const headerStore = await headers();
  
  // Détecter le domaine pour partager les cookies (cardz.dev, app.cardz.dev, shop.cardz.dev)
  const host = headerStore.get('host') || '';
  const isProduction = host.endsWith('.cardz.dev') || host === 'cardz.dev';
  const cookieDomain = isProduction ? '.cardz.dev' : undefined;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              ...(cookieDomain && { domain: cookieDomain }),
              path: '/',
              sameSite: 'lax',
              secure: isProduction,
            })
          );
        } catch {
          // Cette erreur peut être ignorée dans les Server Components
          // car ils ne peuvent pas toujours modifier les cookies après le début de la réponse.
        }
      },
    },
  });
}
