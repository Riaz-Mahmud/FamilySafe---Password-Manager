
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/'];
const publicRoutes = ['/login', '/signup', '/forgot-password'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  
  // Firebase client-side auth sets a custom claim or token.
  // For middleware, we'd typically check a session cookie set after login.
  // Since we are using client-side SDK for auth state, the cookie might not be available here.
  // A robust solution would involve session management, but for now we'll check a hypothetical cookie.
  // If you find redirection not working, this part may need adjustment based on your full auth flow.
  const session = request.cookies.get('firebase-session-cookie-placeholder')?.value;

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  if (session && publicRoutes.includes(path)) {
     return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
