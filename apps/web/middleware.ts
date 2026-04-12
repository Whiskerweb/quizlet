import { updateSession } from './lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';

  // Subdomain routing: shop.cardz.dev → rewrite to /shop/...
  if (hostname.startsWith('shop.')) {
    const pathname = request.nextUrl.pathname;

    // Skip internal paths
    if (!pathname.startsWith('/_next') && !pathname.startsWith('/_trac') && !pathname.startsWith('/api')) {
      const url = request.nextUrl.clone();
      // Always prepend /shop unless already there
      if (!pathname.startsWith('/shop')) {
        url.pathname = `/shop${pathname === '/' ? '' : pathname}`;
      }
      // Use rewrite so the URL stays clean in the browser
      const response = await updateSession(request, url);
      addSecurityHeaders(response);
      return response;
    }
  }

  const response = await updateSession(request);
  addSecurityHeaders(response);
  return response;
}

function addSecurityHeaders(response: NextResponse) {
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://www.traaaction.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in https://accounts.google.com https://www.traaaction.com https://vercel.live",
    "frame-src 'self' https://accounts.google.com",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};




