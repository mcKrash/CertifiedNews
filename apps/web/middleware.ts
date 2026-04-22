import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const isPublicRoute = 
    pathname === '/' || 
    pathname.startsWith('/auth') || 
    pathname.startsWith('/_next') || 
    pathname.includes('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png';

  // If the user is not logged in and trying to access a protected route
  // Allow /article and /profile/[username] to be public
  const isProtectedPath = !isPublicRoute && 
    !pathname.startsWith('/article/') && 
    !pathname.startsWith('/profile/');

  if (!token && isProtectedPath) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  // If the user is logged in and trying to access the login page
  if (token && pathname === '/') {
    const url = new URL('/home', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
