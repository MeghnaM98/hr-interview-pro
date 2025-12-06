import { NextResponse, type NextRequest } from 'next/server';

const protectedMatchers = ['/admin', '/api/admin'];

function isProtectedPath(pathname: string) {
  return protectedMatchers.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return new NextResponse('Admin password not configured.', { status: 500 });
  }

  const cookie = request.cookies.get('admin_auth');
  if (cookie?.value === 'granted') {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString();
      const providedPassword = decoded.split(':')[1];
      if (providedPassword === adminPassword) {
        const response = NextResponse.next();
        response.cookies.set('admin_auth', 'granted', {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60
        });
        return response;
      }
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="HR Interview Pro Admin"'
    }
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
