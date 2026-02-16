import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Paths that are always public (no auth redirect - pages handle their own auth)
const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/about', '/contact', '/download', '/terms', '/privacy', '/faq', '/blocked', '/verify-email', '/admin'];

// Paths that should check for access restrictions (protected app features)
const restrictedPaths = ['/main', '/chat', '/study', '/quiz', '/profile', '/settings'];

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Safety check: Don't run proxy on API routes
  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Validate token if it exists (no DB call, just check for error)
  let isValidToken = false;
  if (token) {
    isValidToken = !token.error;
  }

  // Allow public pages for everyone
  const isPublicPath = publicPaths.some(pp => path === pp || path.startsWith(pp + '/'));
  if (isPublicPath) {
    // If user is authenticated and tries to access login or signup, redirect to main
    if (token && isValidToken && (path === '/login' || path === '/signup')) {
      return NextResponse.redirect(new URL('/main', request.url));
    }
    return NextResponse.next();
  }

  // If not authenticated or token is invalid, redirect to login for all other pages
  if (!token || !isValidToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  // Check for access restrictions on protected paths
  const isRestrictedPath = restrictedPaths.some(rp => path.startsWith(rp));
  if (isRestrictedPath && token) {
    try {
      // Call access-check API to see if user is restricted
      const baseUrl = request.nextUrl.origin;
      const checkUrl = new URL('/api/access-check', baseUrl);

      const response = await fetch(checkUrl.toString(), {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.restricted) {
          // User is restricted, redirect to blocked page
          return NextResponse.redirect(new URL('/blocked', request.url));
        }
      }
    } catch (error) {
      // On error, allow access (fail open for user experience)
      console.error('Proxy restriction check error:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all pages except static assets and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo|uploads|apk|videos).*)',
  ],
};
