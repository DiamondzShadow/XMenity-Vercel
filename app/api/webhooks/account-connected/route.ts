import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { thirdwebService } from '@/lib/thirdweb-sdk';
import { walletBindingService } from '@/lib/wallet-bindings';
import { insightIQService } from '@/lib/insightiq';

// Webhook handler for X account connections
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (implement your webhook secret verification)
    const signature = request.headers.get('x-webhook-signature');
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Unauthorized webhook', success: false },
        { status: 401 }
      );
    }

    // TODO: Implement proper webhook signature verification
    // const isValidSignature = verifyWebhookSignature(body, signature, webhookSecret);
    // if (!isValidSignature) { ... }

    const body = await request.json();
    const { account_id, user_id, platform = 'twitter' } = body;

    if (!account_id) {
      return NextResponse.json(
        { error: 'Missing account_id', success: false },
        { status: 400 }
      );
    }

    console.log(`Processing ${platform} account connection for account_id: ${account_id}`);

    // 1. Fetch X profile data from InsightIQ
    let profile;
    try {
      profile = await fetchProfileFromInsightIQ(account_id);
      console.log('Profile fetched:', profile.username);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile data', success: false },
        { status: 400 }
      );
    }

    // 2. Look up wallet address from existing bindings
    const existingBindings = await walletBindingService.getBindingsByPlatformUser(account_id);
    
    if (existingBindings.length === 0) {
      // No wallet linked yet - user needs to connect wallet first
      return NextResponse.json({
        success: true,
        action: 'wallet_required',
        message: 'User needs to connect wallet first',
        profile: {
          id: account_id,
          username: profile.username,
          followers: profile.followerCount,
          verified: profile.isVerified
        }
      });
    }

    // 3. Process minting for each linked wallet
    const mintResults = [];
    
    for (const binding of existingBindings) {
      try {
        // Skip if already minted
        if (binding.minted) {
          console.log(`Already minted for ${binding.walletAddress}`);
          continue;
        }

        // Calculate mint amount based on followers
        const baseAmount = "1"; // 1 token base
        const followerBonus = Math.floor(profile.followerCount / 1000) * 0.1; // 0.1 per 1k followers
        const totalAmount = (parseFloat(baseAmount) + followerBonus).toString();

        // 4. Mint tokens via factory contract
        const mintResult = await mintTokensToWallet(
          binding.walletAddress,
          totalAmount,
          account_id,
          profile
        );

        if (mintResult.success) {
          // Mark as minted in database
          await walletBindingService.markAsMinted(
            account_id,
            binding.walletAddress,
            {
              txHash: mintResult.txHash,
              amount: totalAmount,
              followerCount: profile.followerCount,
              mintedAt: new Date().toISOString(),
              profile: profile
            }
          );

          mintResults.push({
            wallet: binding.walletAddress,
            amount: totalAmount,
            txHash: mintResult.txHash,
            success: true
          });

          console.log(`Minted ${totalAmount} tokens to ${binding.walletAddress}`);
        } else {
          mintResults.push({
            wallet: binding.walletAddress,
            error: mintResult.error,
            success: false
          });
        }

      } catch (error) {
        console.error(`Error minting to ${binding.walletAddress}:`, error);
        mintResults.push({
          wallet: binding.walletAddress,
          error: error.message,
          success: false
        });
      }
    }

    // 5. (Optional) Update contract metadata with profile info
    if (profile.profileImage || profile.bio) {
      try {
        await updateTokenMetadata(account_id, profile);
      } catch (error) {
        console.error('Error updating metadata:', error);
        // Continue even if metadata update fails
      }
    }

    return NextResponse.json({
      success: true,
      account_id,
      profile: {
        username: profile.username,
        followers: profile.followerCount,
        verified: profile.isVerified
      },
      mintResults,
      totalWallets: existingBindings.length,
      successfulMints: mintResults.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', success: false },
      { status: 500 }
    );
  }
}

// Function to fetch profile from InsightIQ
async function fetchProfileFromInsightIQ(account_id: string) {
  const apiKey = process.env.INSIGHTIQ_API_KEY;
  if (!apiKey) {
    throw new Error('InsightIQ API key not configured');
  }

  const response = await fetch(
    `https://api.staging.insightiq.ai/v1/profiles?account_id=${account_id}`,
    {
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`InsightIQ API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Transform to standardized format
  return {
    id: account_id,
    username: data.username || data.handle || `user_${account_id}`,
    displayName: data.displayName || data.name,
    bio: data.bio || data.description,
    followerCount: data.followerCount || data.followers || 0,
    followingCount: data.followingCount || data.following || 0,
    postCount: data.postCount || data.tweets || 0,
    isVerified: data.isVerified || data.verified || false,
    profileImage: data.profileImage || data.avatar || data.profile_image_url,
    createdAt: data.createdAt || data.created_at,
    location: data.location,
    website: data.website || data.url
  };
}

// Function to mint tokens to a specific wallet
async function mintTokensToWallet(
  walletAddress: string,
  amount: string,
  platformUserId: string,
  profile: any
) {
  try {
    // Get or deploy token for this creator
    const tokenAddress = await getOrDeployCreatorToken(walletAddress, profile);
    
    // Initialize oracle signer
    const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY;
    if (!oraclePrivateKey) {
      throw new Error('Oracle private key not configured');
    }

    const provider = new ethers.providers.JsonRpcProvider(
      process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'
    );
    const oracleSigner = new ethers.Wallet(oraclePrivateKey, provider);

    // Mint tokens using Thirdweb service
    const txHash = await thirdwebService.mintTokens(
      tokenAddress,
      {
        to: walletAddress,
        amount: amount
      },
      oracleSigner
    );

    return {
      success: true,
      txHash,
      tokenAddress,
      amount
    };

  } catch (error) {
    console.error('Minting error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to get existing token or deploy new one
async function getOrDeployCreatorToken(creatorAddress: string, profile: any): Promise<string> {
  // Check if creator already has a token
  const existingTokenAddress = await thirdwebService.getCreatorTokenAddress(creatorAddress);
  
  if (existingTokenAddress) {
    return existingTokenAddress;
  }

  // Deploy new token for creator
  const tokenConfig = {
    name: `${profile.username || 'Creator'}Token`,
    symbol: (profile.username || 'CREATOR').slice(0, 6).toUpperCase(),
    tokensPerFollower: "1",
    tokensPerPost: "10",
    maxSupply: "0" // Unlimited supply
  };

  const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY;
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'
  );
  const oracleSigner = new ethers.Wallet(oraclePrivateKey, provider);

  return await thirdwebService.deployCreatorToken(
    tokenConfig,
    creatorAddress,
    oracleSigner
  );
}

// Function to update token/contract metadata
async function updateTokenMetadata(platformUserId: string, profile: any) {
  try {
    // Create metadata JSON
    const metadata = {
      name: `${profile.username}Token`,
      description: `Social token for ${profile.username}${profile.bio ? ` - ${profile.bio}` : ''}`,
      image: profile.profileImage,
      external_url: `https://twitter.com/${profile.username}`,
      attributes: [
        {
          trait_type: "Platform",
          value: "Twitter/X"
        },
        {
          trait_type: "Followers",
          value: profile.followerCount,
          display_type: "number"
        },
        {
          trait_type: "Verified",
          value: profile.isVerified ? "Yes" : "No"
        },
        {
          trait_type: "Created",
          value: new Date().toISOString()
        }
      ]
    };

    // Upload metadata to IPFS or your storage service
    const metadataUri = await uploadMetadata(metadata);
    
    // Update contract URI (implementation depends on your contract)
    // await updateContractURI(tokenAddress, metadataUri);
    
    console.log('Metadata updated:', metadataUri);
    return metadataUri;

  } catch (error) {
    console.error('Metadata update error:', error);
    throw error;
  }
}

// Function to upload metadata (implement based on your storage choice)
async function uploadMetadata(metadata: any): Promise<string> {
  // Option 1: IPFS via Thirdweb
  // const uri = await thirdwebService.uploadToIPFS(metadata);
  
  // Option 2: Your own storage service
  // const uri = await uploadToYourService(metadata);
  
  // For now, return a placeholder
  return `https://your-metadata-service.com/metadata/${Date.now()}.json`;
}

// Verify webhook signature (implement based on your webhook provider)
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  // Implement signature verification based on your webhook provider
  // Example for GitHub-style HMAC:
  // const hmac = crypto.createHmac('sha256', secret);
  // hmac.update(body);
  // const expectedSignature = 'sha256=' + hmac.digest('hex');
  // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  
  return true; // Placeholder - implement proper verification
}