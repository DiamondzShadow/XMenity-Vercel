import { NextRequest, NextResponse } from 'next/server';
import { siweService } from '@/lib/siwe';
import { walletBindingService } from '@/lib/wallet-bindings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, signature, nonce, platformUserId, platformUsername } = body;

    if (!message || !signature || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      );
    }

    // Verify the SIWE message
    const verificationResult = await siweService.verifyMessage({
      message,
      signature,
      nonce
    });

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.error || 'Verification failed', success: false },
        { status: 401 }
      );
    }

    const walletAddress = verificationResult.address!;

    // If platform user info is provided, create a binding
    if (platformUserId && platformUsername) {
      try {
        // Check if binding already exists
        const existingBinding = await walletBindingService.getBinding(
          platformUserId,
          walletAddress
        );

        if (!existingBinding) {
          // Create new binding
          await walletBindingService.createBinding({
            platformUserId,
            platformUsername,
            walletAddress,
            extraMetadata: {
              verificationMethod: 'siwe',
              verifiedAt: new Date().toISOString(),
            }
          });
        }
      } catch (bindingError) {
        console.error('Error creating wallet binding:', bindingError);
        // Continue with verification success even if binding fails
      }
    }

    // Clear the used nonce
    siweService.clearSession(nonce);

    return NextResponse.json({
      success: true,
      address: walletAddress,
      verified: true
    });

  } catch (error) {
    console.error('Error verifying SIWE message:', error);
    return NextResponse.json(
      { error: 'Verification failed', success: false },
      { status: 500 }
    );
  }
}