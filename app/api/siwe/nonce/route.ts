import { NextResponse } from 'next/server';
import { siweService } from '@/lib/siwe';

export async function GET() {
  try {
    const nonce = siweService.generateNonce();
    
    return NextResponse.json({ 
      nonce,
      success: true 
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce', success: false },
      { status: 500 }
    );
  }
}