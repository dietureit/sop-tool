import { getToken } from 'next-auth/jwt';

const publicPaths = ['/', '/login', '/api/auth'];

function isPublicPath(pathname) {
  return publicPaths.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p + '/')));
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return;
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token && pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!token && !pathname.startsWith('/api/')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return Response.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin') && !token?.roles?.includes('super_admin')) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return Response.redirect(dashboardUrl);
  }

  return;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
