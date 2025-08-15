import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple rate limiting for serverless environments
// For production, consider using Upstash Redis or platform-specific rate limiting
function simpleRateLimit(request: NextRequest): boolean {
  // In serverless environments, we can't rely on in-memory storage
  // This implementation uses headers for basic protection
  // For production, integrate with Redis or use platform rate limiting features
  
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  // Basic validation - reject if suspicious patterns detected
  if (forwardedFor && forwardedFor.split(',').length > 5) {
    return false; // Too many forwarded IPs might indicate abuse
  }
  
  return true; // Allow for now - implement proper distributed rate limiting in production
}

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Apply basic rate limiting to API routes
    if (!simpleRateLimit(request)) {
      return new NextResponse('Too many requests', { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        }
      });
    }

    const response = NextResponse.next();

    // CORS headers
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001'
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};