import { NextResponse, type NextRequest } from 'next/server';

import { isPersonalAccessAuthorized, personalAccessChallenge } from '@/lib/personal-access';

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === '/api/collection/scheduled' ||
    request.nextUrl.pathname === '/api/notifications/deliver'
  )
    return NextResponse.next();
  if (isPersonalAccessAuthorized(request.headers.get('authorization'))) return NextResponse.next();
  return new NextResponse('Personal access required.', {
    status: 401,
    headers: { 'WWW-Authenticate': personalAccessChallenge() },
  });
}

export const config = {
  matcher: [
    '/((?!api/collection/scheduled|api/notifications/deliver|_next/static|_next/image|favicon.ico).*)',
  ],
};
