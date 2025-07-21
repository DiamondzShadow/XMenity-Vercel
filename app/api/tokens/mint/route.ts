import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { thirdwebService } from '@/lib/thirdweb-sdk';
import { walletBindingService } from '@/lib/wallet-bindings';

// This should be called by the oracle/backend service only
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (API key or secret)
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.ORACLE_API_SECRET;
    
    if (!authHeader || !expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      tokenAddress, 
      recipientAddress, 
      amount, 
      milestoneId, 
      platformUserId,
      reason 
    } = body;

    if (!tokenAddress || !recipientAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      );
    }

    // Initialize oracle signer
    const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY;
    if (!oraclePrivateKey) {
      throw new Error('Oracle private key not configured');
    }

    const provider = new ethers.providers.JsonRpcProvider(
      process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'
    );
    const oracleSigner = new ethers.Wallet(oraclePrivateKey, provider);

    // Mint tokens via Thirdweb service
    const txHash = await thirdwebService.mintTokens(
      tokenAddress,
      {
        to: recipientAddress,
        amount: amount.toString(),
        milestoneId
      },
      oracleSigner
    );

    // Update binding if platform user provided
    if (platformUserId) {
      try {
        await walletBindingService.markAsMinted(
          platformUserId,
          recipientAddress,
          {
            txHash,
            amount,
            milestoneId,
            reason,
            mintedAt: new Date().toISOString()
          }
        );
      } catch (bindingError) {
        console.error('Error updating binding:', bindingError);
        // Continue even if binding update fails
      }
    }

    return NextResponse.json({
      success: true,
      txHash,
      amount,
      recipient: recipientAddress,
      tokenAddress
    });

  } catch (error) {
    console.error('Error minting tokens:', error);
    return NextResponse.json(
      { error: 'Failed to mint tokens', success: false },
      { status: 500 }
    );
  }
}