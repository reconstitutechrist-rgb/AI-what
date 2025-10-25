import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Set your password here or use environment variable
const SITE_PASSWORD = process.env.SITE_PASSWORD || 'MySecurePassword123';

export function middleware(request: NextRequest) {
  // Skip password check for API routes (needed for app functionality)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check if user has valid session
  const authCookie = request.cookies.get('site-auth');
  
  if (authCookie?.value === SITE_PASSWORD) {
    return NextResponse.next();
  }

  // Check if this is a password submission
  const url = request.nextUrl.clone();
  if (url.pathname === '/auth' && request.method === 'POST') {
    return NextResponse.next();
  }

  // If no valid auth, redirect to login page
  if (url.pathname !== '/login') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
