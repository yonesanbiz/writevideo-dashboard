import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // index.htmlとAPIは除外
  if (pathname === '/' || 
      pathname === '/index.html' || 
      pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // HTMLファイルへのアクセスはセッション確認
  if (pathname.endsWith('.html')) {
    const session = request.cookies.get('wv_session');
    
    if (!session) {
      return NextResponse.redirect(new URL('/index.html', request.url));
    }

    try {
      const data = JSON.parse(Buffer.from(session.value, 'base64').toString());
      if (!data.auth) {
        return NextResponse.redirect(new URL('/index.html', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/index.html', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
