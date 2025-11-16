import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequestWithAuth } from 'next-auth/middleware';
// Removed: import { prisma } from '@/lib/prisma';

// Paths that are always public
const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/about', '/contact', '/download', '/terms', '/faq'];

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Safety check: Don't run middleware on API routes
  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Validate token if it exists (no DB call, just check for error)
  let isValidToken = false;
  if (token) {
    isValidToken = !token.error;
  }

  // Allow public pages for everyone
  if (publicPaths.includes(path)) {
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

  return NextResponse.next();
}

export const config = {
  // Match all pages except static assets and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo|uploads).*)',
  ],
}; 