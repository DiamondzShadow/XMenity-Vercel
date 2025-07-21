const express = require('express');
const { ethers } = require('ethers');
const { ThirdwebSDK } = require('@thirdweb-dev/sdk');
const { Arbitrum } = require('@thirdweb-dev/chains');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Thirdweb SDK
let sdk;
let oracleSigner;

async function initializeSDK() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'
    );
    
    oracleSigner = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);
    
    sdk = ThirdwebSDK.fromSigner(oracleSigner, Arbitrum, {
      clientId: process.env.THIRDWEB_CLIENT_ID,
    });
    
    console.log('Oracle SDK initialized successfully');
    console.log('Oracle address:', await oracleSigner.getAddress());
  } catch (error) {
    console.error('Failed to initialize SDK:', error);
    process.exit(1);
  }
}

// Authentication middleware for webhook endpoints
function authenticateWebhook(req, res, next) {
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.ORACLE_API_SECRET;
  
  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    oracle: oracleSigner ? await oracleSigner.getAddress() : 'not initialized'
  });
});

// X Account Connection Webhook
app.post('/webhook/account-connected', authenticateWebhook, async (req, res) => {
  try {
    const { account_id, user_id, platform = 'twitter' } = req.body;
    
    if (!account_id) {
      return res.status(400).json({ error: 'Missing account_id' });
    }

    console.log(`Processing ${platform} account connection:`, account_id);

    // 1. Fetch X profile data
    const profile = await fetchProfileFromInsightIQ(account_id);
    
    // 2. Look up wallet bindings (you'll need to implement this)
    const walletBindings = await getWalletBindings(account_id);
    
    if (walletBindings.length === 0) {
      return res.json({
        success: true,
        action: 'wallet_required',
        message: 'User needs to connect wallet first',
        profile: {
          id: account_id,
          username: profile.username,
          followers: profile.followerCount
        }
      });
    }

    // 3. Process minting for each wallet
    const mintResults = [];
    
    for (const binding of walletBindings) {
      if (binding.minted) {
        console.log(`Already minted for ${binding.walletAddress}`);
        continue;
      }

      // Calculate mint amount
      const baseAmount = "1";
      const followerBonus = Math.floor(profile.followerCount / 1000) * 0.1;
      const totalAmount = (parseFloat(baseAmount) + followerBonus).toString();

      try {
        // 4. Mint tokens via factory
        const factoryAddress = process.env.SOCIAL_TOKEN_FACTORY_ADDRESS;
        const factory = await sdk.getContract(factoryAddress);
        
        const tx = await factory.call("mintTo", [
          binding.walletAddress,
          ethers.utils.parseEther(totalAmount)
        ]);

        mintResults.push({
          wallet: binding.walletAddress,
          amount: totalAmount,
          txHash: tx.receipt.transactionHash,
          success: true
        });

        // Mark as minted in your database
        await markWalletAsMinted(account_id, binding.walletAddress, {
          txHash: tx.receipt.transactionHash,
          amount: totalAmount,
          followerCount: profile.followerCount
        });

        console.log(`Minted ${totalAmount} tokens to ${binding.walletAddress}`);

      } catch (error) {
        console.error(`Mint error for ${binding.walletAddress}:`, error);
        mintResults.push({
          wallet: binding.walletAddress,
          error: error.message,
          success: false
        });
      }
    }

    // 5. Update contract metadata
    if (profile.profileImage || profile.bio) {
      try {
        await updateTokenMetadata(account_id, profile);
      } catch (error) {
        console.error('Metadata update error:', error);
      }
    }

    res.json({
      success: true,
      account_id,
      profile: {
        username: profile.username,
        followers: profile.followerCount,
        verified: profile.isVerified
      },
      mintResults,
      totalWallets: walletBindings.length,
      successfulMints: mintResults.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Manual mint endpoint (for testing)
app.post('/api/mint', authenticateWebhook, async (req, res) => {
  try {
    const { tokenAddress, recipientAddress, amount, reason } = req.body;
    
    if (!tokenAddress || !recipientAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tokenContract = await sdk.getContract(tokenAddress);
    
    const tx = await tokenContract.call("mint", [
      recipientAddress,
      ethers.utils.parseEther(amount.toString())
    ]);

    res.json({
      success: true,
      txHash: tx.receipt.transactionHash,
      amount,
      recipient: recipientAddress,
      reason
    });

  } catch (error) {
    console.error('Manual mint error:', error);
    res.status(500).json({ error: 'Mint failed' });
  }
});

// Factory mint endpoint
app.post('/api/factory/mint', authenticateWebhook, async (req, res) => {
  try {
    const { recipientAddress, amount, tokenId } = req.body;
    
    if (!recipientAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const factoryAddress = process.env.SOCIAL_TOKEN_FACTORY_ADDRESS;
    const factory = await sdk.getContract(factoryAddress);
    
    const tx = await factory.call("mintTo", [
      recipientAddress,
      ethers.utils.parseEther(amount.toString())
    ]);

    res.json({
      success: true,
      txHash: tx.receipt.transactionHash,
      amount,
      recipient: recipientAddress,
      factory: factoryAddress
    });

  } catch (error) {
    console.error('Factory mint error:', error);
    res.status(500).json({ error: 'Factory mint failed' });
  }
});

// Get token info endpoint
app.get('/api/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const tokenContract = await sdk.getContract(address);
    
    const [name, symbol, totalSupply, decimals] = await Promise.all([
      tokenContract.call("name"),
      tokenContract.call("symbol"),
      tokenContract.call("totalSupply"),
      tokenContract.call("decimals")
    ]);
    
    res.json({
      address,
      name,
      symbol,
      totalSupply: ethers.utils.formatEther(totalSupply),
      decimals: decimals.toString()
    });

  } catch (error) {
    console.error('Token info error:', error);
    res.status(500).json({ error: 'Failed to get token info' });
  }
});

// Batch mint endpoint
app.post('/api/batch-mint', authenticateWebhook, async (req, res) => {
  try {
    const { recipients } = req.body; // [{ address, amount }, ...]
    
    if (!recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'Invalid recipients array' });
    }

    const factoryAddress = process.env.SOCIAL_TOKEN_FACTORY_ADDRESS;
    const factory = await sdk.getContract(factoryAddress);
    
    const addresses = recipients.map(r => r.address);
    const amounts = recipients.map(r => ethers.utils.parseEther(r.amount.toString()));
    
    const tx = await factory.call("batchMintTo", [addresses, amounts]);

    res.json({
      success: true,
      txHash: tx.receipt.transactionHash,
      recipients: recipients.length,
      totalAmount: recipients.reduce((sum, r) => sum + parseFloat(r.amount), 0)
    });

  } catch (error) {
    console.error('Batch mint error:', error);
    res.status(500).json({ error: 'Batch mint failed' });
  }
});

// Update metadata endpoint
app.post('/api/metadata/update', authenticateWebhook, async (req, res) => {
  try {
    const { contractAddress, metadata } = req.body;
    
    if (!contractAddress || !metadata) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Upload to IPFS
    const metadataUri = await sdk.storage.upload(metadata);
    
    // Update contract URI
    const contract = await sdk.getContract(contractAddress);
    const tx = await contract.call("setContractURI", [metadataUri]);

    res.json({
      success: true,
      txHash: tx.receipt.transactionHash,
      metadataUri,
      contractAddress
    });

  } catch (error) {
    console.error('Metadata update error:', error);
    res.status(500).json({ error: 'Metadata update failed' });
  }
});

// Helper function to fetch profile from InsightIQ
async function fetchProfileFromInsightIQ(account_id) {
  const apiKey = process.env.INSIGHTIQ_API_KEY;
  
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
  
  return {
    id: account_id,
    username: data.username || data.handle || `user_${account_id}`,
    displayName: data.displayName || data.name,
    bio: data.bio || data.description,
    followerCount: data.followerCount || data.followers || 0,
    isVerified: data.isVerified || data.verified || false,
    profileImage: data.profileImage || data.avatar,
  };
}

// Helper function to get wallet bindings (implement with your database)
async function getWalletBindings(platformUserId) {
  // TODO: Implement database lookup
  // Example return format:
  return [
    {
      platformUserId,
      walletAddress: "0x742d35Cc6641Bb8b2a0b9b4F7c4a2a3E3a2E2E2E",
      minted: false,
      dateLinked: new Date()
    }
  ];
}

// Helper function to mark wallet as minted (implement with your database)
async function markWalletAsMinted(platformUserId, walletAddress, metadata) {
  // TODO: Implement database update
  console.log(`Marking ${walletAddress} as minted for ${platformUserId}`, metadata);
}

// Helper function to update token metadata
async function updateTokenMetadata(platformUserId, profile) {
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
      }
    ]
  };

  // Upload to IPFS
  const metadataUri = await sdk.storage.upload(metadata);
  console.log('Metadata uploaded:', metadataUri);
  
  return metadataUri;
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize and start server
async function startServer() {
  await initializeSDK();
  
  app.listen(PORT, () => {
    console.log(`🚀 Oracle service running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🏭 Factory address: ${process.env.SOCIAL_TOKEN_FACTORY_ADDRESS}`);
  });
}

// Start the server
startServer().catch(console.error);

module.exports = app;