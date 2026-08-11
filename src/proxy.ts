import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === '/api/collection/scheduled' ||
    request.nextUrl.pathname === '/api/notifications/deliver'
  )
    return NextResponse.next();
  if (request.nextUrl.pathname === '/login' || request.cookies.has('rolepilot-access-token'))
    return NextResponse.next();
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    '/((?!api/collection/scheduled|api/notifications/deliver|_next/static|_next/image|favicon.ico).*)',
  ],
};
