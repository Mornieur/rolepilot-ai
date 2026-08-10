import { NextResponse, type NextRequest } from 'next/server';

import { isPersonalAccessAuthorized, personalAccessChallenge } from '@/lib/personal-access';

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === '/api/collection/scheduled' ||
    request.nextUrl.pathname === '/api/notifications/deliver'
  )
    return NextResponse.next();
  if (!isPersonalAccessAuthorized(request.headers.get('authorization')))
    return new NextResponse('Personal access required.', {
      status: 401,
      headers: { 'WWW-Authenticate': personalAccessChallenge() },
    });
  if (request.nextUrl.pathname === '/login' || request.cookies.has('rolepilot-access-token'))
    return NextResponse.next();
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    '/((?!api/collection/scheduled|api/notifications/deliver|_next/static|_next/image|favicon.ico).*)',
  ],
};
