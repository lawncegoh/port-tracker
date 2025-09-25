import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = [/^\/login$/, /^\/api\/auth\//];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some((regex) => regex.test(pathname));

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret' });
  const isAuthenticated = Boolean(token);

  if (!isAuthenticated && !isPublic) {
    const redirectUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      redirectUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
