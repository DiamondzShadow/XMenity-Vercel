import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export interface AuthenticatedUser {
  id: string;
  walletAddress: string;
  email?: string | null;
  isActive: boolean;
  isVerified: boolean;
}

export async function authenticateToken(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        isActive: true,
        isVerified: true,
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await authenticateToken(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

// Note: Rate limiting has been moved to middleware.ts
// For production serverless deployments, consider using:
// - Upstash Redis for distributed rate limiting
// - Platform-specific rate limiting (Vercel Edge Config, Netlify Edge Functions, etc.)
// - External services like Cloudflare Rate Limiting