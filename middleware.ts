import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
    });
  }

  const encodedCredentials = authHeader.split(' ')[1];
  if (!encodedCredentials) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
    });
  }

  const credentials = Buffer.from(encodedCredentials, 'base64').toString();
  const [username, password] = credentials.split(':');
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    return NextResponse.next();
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
  });
}

export const config = {
  matcher: ['/admin/:path*']
};
