# 🔗 Social Token Factory - SIWE & Thirdweb Integration Guide

This guide covers the complete integration of **Sign-In With Ethereum (SIWE)**, **Thirdweb SDK**, and **Wallet Binding** functionality into the Social Token Factory platform.

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment variables and configure your deployment:

```bash
# Copy environment template
cp .env.example .env.local

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push
```

### 2. Required Environment Variables

```env
# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID="your_thirdweb_client_id"

# Oracle Configuration (for secure minting)
ORACLE_PRIVATE_KEY="your_oracle_private_key"
ORACLE_API_SECRET="your_secure_api_secret"

# Network Configuration
ARBITRUM_RPC_URL="https://arb1.arbitrum.io/rpc"

# Contract Addresses (set after deployment)
NEXT_PUBLIC_SOCIAL_TOKEN_FACTORY_ADDRESS=""
NEXT_PUBLIC_CREATOR_WALLET_FACTORY_ADDRESS=""
NEXT_PUBLIC_CREATOR_IDENTITY_NFT_ADDRESS=""
NEXT_PUBLIC_REWARD_DISTRIBUTOR_ADDRESS=""
```

## 🏗️ Architecture Overview

### Core Components

1. **SIWE Service** (`lib/siwe.ts`)
   - Secure wallet authentication
   - Nonce generation and verification
   - Session management

2. **Thirdweb Service** (`lib/thirdweb-sdk.ts`)
   - Contract interactions on Arbitrum
   - Token deployment and management
   - Batch operations

3. **Wallet Binding Service** (`lib/wallet-bindings.ts`)
   - X/Twitter account linking
   - Sybil protection
   - Mint tracking

4. **WalletConnect Component** (`components/WalletConnect.tsx`)
   - User-friendly wallet connection
   - SIWE integration
   - Network validation

## 🔐 SIWE (Sign-In With Ethereum) Integration

### How It Works

1. **Nonce Generation**: Backend generates cryptographically secure nonce
2. **Message Creation**: Frontend creates standardized SIWE message
3. **User Signature**: User signs message with their wallet
4. **Verification**: Backend verifies signature authenticity
5. **Session Creation**: Authenticated session established

### Frontend Usage

```tsx
import { WalletConnect } from '@/components/WalletConnect';

export function MyComponent() {
  const handleWalletVerified = (address: string) => {
    console.log('Wallet verified:', address);
    // Proceed with authenticated actions
  };

  return (
    <WalletConnect
      onVerified={handleWalletVerified}
      platformUserId="twitter_user_123"
      platformUsername="@creator"
    />
  );
}
```

### API Endpoints

#### Generate Nonce
```http
GET /api/siwe/nonce
```

Response:
```json
{
  "nonce": "abc123...",
  "success": true
}
```

#### Verify Signature
```http
POST /api/siwe/verify
Content-Type: application/json

{
  "message": "domain.com wants you to sign in...",
  "signature": "0x...",
  "nonce": "abc123...",
  "platformUserId": "twitter_123",
  "platformUsername": "@creator"
}
```

## 🛠️ Thirdweb SDK Integration

### Initialization

```typescript
import { thirdwebService } from '@/lib/thirdweb-sdk';
import { ethers } from 'ethers';

// Initialize with user's signer
const signer = new ethers.Wallet(privateKey, provider);
await thirdwebService.initialize(signer);
```

### Token Deployment

```typescript
const config = {
  name: "CreatorCoin",
  symbol: "CREATE",
  tokensPerFollower: "1",
  tokensPerPost: "10",
  maxSupply: "1000000"
};

const tokenAddress = await thirdwebService.deployCreatorToken(
  config,
  creatorAddress,
  signer
);
```

### Secure Minting (Oracle Only)

```typescript
// Oracle endpoint: POST /api/tokens/mint
const response = await fetch('/api/tokens/mint', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.ORACLE_API_SECRET}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tokenAddress: "0x...",
    recipientAddress: "0x...",
    amount: "100",
    milestoneId: 1,
    platformUserId: "twitter_123",
    reason: "Reached 10k followers"
  })
});
```

## 🔗 Wallet Binding System

### Creating Bindings

```typescript
import { walletBindingService } from '@/lib/wallet-bindings';

// Create new binding
const binding = await walletBindingService.createBinding({
  platformUserId: "twitter_123456",
  platformUsername: "@creator",
  walletAddress: "0x742d35Cc6641Bb8b2a0b9b4F7c4a2a3E3a2E2E2E",
  extraMetadata: {
    followerCount: 10000,
    verifiedAt: new Date().toISOString()
  }
});
```

### Preventing Sybil Attacks

```typescript
// Check if user already minted
const hasUserMinted = await walletBindingService.hasUserMinted(
  "twitter_123456",
  "0x742d35Cc6641Bb8b2a0b9b4F7c4a2a3E3a2E2E2E"
);

if (hasUserMinted) {
  throw new Error("User has already minted tokens for this wallet");
}
```

### Analytics & Monitoring

```typescript
// Get binding statistics
const stats = await walletBindingService.getBindingStats();
console.log({
  totalBindings: stats.totalBindings,
  mintingRate: stats.mintingRate,
  uniqueWallets: stats.uniqueWallets
});
```

## 🎯 Complete User Flow

### 1. Wallet Connection & Verification

```tsx
// User connects wallet
<WalletConnect
  onVerified={(address) => {
    setWalletAddress(address);
    setStep('twitter-verify');
  }}
/>
```

### 2. Twitter Account Verification

```typescript
// Via InsightIQ integration
const twitterProfile = await insightIQService.getCreatorProfile(handle);

// Create wallet binding
await walletBindingService.createBinding({
  platformUserId: twitterProfile.id,
  platformUsername: twitterProfile.username,
  walletAddress: walletAddress,
  extraMetadata: twitterProfile
});
```

### 3. Token Deployment

```typescript
const tokenConfig = {
  name: `${username}Token`,
  symbol: username.slice(0, 4).toUpperCase(),
  tokensPerFollower: "1",
  tokensPerPost: "10",
  maxSupply: "0" // Unlimited
};

const tokenAddress = await thirdwebService.deployCreatorToken(
  tokenConfig,
  walletAddress,
  signer
);
```

### 4. Milestone-Based Minting

```typescript
// Oracle monitors social metrics and triggers mints
const milestoneReached = await checkFollowerMilestone(twitterId);

if (milestoneReached) {
  await fetch('/api/tokens/mint', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ORACLE_API_SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tokenAddress,
      recipientAddress: walletAddress,
      amount: "1000",
      milestoneId: milestoneReached.id,
      platformUserId: twitterId,
      reason: `Reached ${milestoneReached.threshold} followers`
    })
  });
}
```

## 🛡️ Security Considerations

### SIWE Security

- ✅ **Nonce Uniqueness**: Each signature uses a unique nonce
- ✅ **Time Expiration**: Messages expire after 10 minutes
- ✅ **Domain Binding**: Messages are bound to your domain
- ✅ **Replay Protection**: Used nonces are cleared immediately

### Oracle Security

- ✅ **API Key Authentication**: Oracle endpoints require secret key
- ✅ **Private Key Protection**: Oracle private key stored securely
- ✅ **Rate Limiting**: Prevent spam minting attempts
- ✅ **Milestone Verification**: Double-check social metrics

### Wallet Binding Security

- ✅ **Unique Constraints**: Prevent duplicate bindings
- ✅ **Sybil Protection**: Track minting per user/wallet combo
- ✅ **Data Validation**: Verify wallet address format
- ✅ **Soft Deletion**: Maintain audit trails

## 🧪 Testing

### Local Development

```bash
# Start development server
npm run dev

# Run Prisma studio
npx prisma studio

# Test smart contracts
cd contracts
npx hardhat test
```

### Testing SIWE Flow

```typescript
// Test nonce generation
const response = await fetch('http://localhost:3000/api/siwe/nonce');
const { nonce } = await response.json();

// Test signature verification
// (Use actual wallet signature in real tests)
```

### Testing Contract Interactions

```bash
# Deploy to local hardhat network
cd contracts
npx hardhat run scripts/deploy.js --network localhost

# Test minting
npx hardhat run scripts/test-mint.js --network localhost
```

## 🚀 Deployment

### 1. Deploy Smart Contracts

```bash
cd contracts

# Deploy to Arbitrum Sepolia (testnet)
npx hardhat run scripts/deploy.js --network arbitrumSepolia

# Deploy to Arbitrum Mainnet
npx hardhat run scripts/deploy.js --network arbitrum
```

### 2. Update Environment Variables

```env
# Update with deployed contract addresses
NEXT_PUBLIC_SOCIAL_TOKEN_FACTORY_ADDRESS="0x..."
NEXT_PUBLIC_CREATOR_WALLET_FACTORY_ADDRESS="0x..."
# ... etc
```

### 3. Database Migration

```bash
# Apply Prisma migrations
npx prisma db push

# Or create and apply migration
npx prisma migrate dev --name add-wallet-bindings
```

### 4. Deploy Frontend

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

#### GCP Deployment

```bash
# Build for production
npm run build

# Deploy to GCP App Engine
gcloud app deploy
```

## 📊 Monitoring & Analytics

### Wallet Binding Metrics

```typescript
// Daily binding stats
const stats = await walletBindingService.getBindingStats();

// Recent activity
const recentBindings = await walletBindingService.getBindingsByDateRange(
  new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
  new Date()
);
```

### Contract Monitoring

```typescript
// Token metrics
const tokenInfo = await thirdwebService.getTokenInfo(tokenAddress);
const metrics = await thirdwebService.getTokenMetrics(tokenAddress);

console.log({
  totalSupply: tokenInfo.totalSupply,
  lastFollowerCount: metrics.lastFollowerCount,
  mintingRate: metrics.tokensPerFollower
});
```

## 🆘 Troubleshooting

### Common Issues

#### 1. SIWE Verification Fails
```
Error: Invalid signature
```
**Solution**: Ensure client and server are using the same message format and nonce.

#### 2. Contract Interaction Fails
```
Error: Factory contract address not configured
```
**Solution**: Set `NEXT_PUBLIC_SOCIAL_TOKEN_FACTORY_ADDRESS` in environment variables.

#### 3. Wallet Binding Errors
```
Error: Binding already exists
```
**Solution**: Check if user has already linked this wallet, use update operations instead.

#### 4. Oracle Minting Fails
```
Error: Unauthorized
```
**Solution**: Verify `ORACLE_API_SECRET` is set correctly in environment.

### Debug Mode

Enable debug logging:

```env
# Enable debug logs
DEBUG=siwe,thirdweb,bindings
NODE_ENV=development
```

## 📚 API Reference

### SIWE Endpoints

- `GET /api/siwe/nonce` - Generate authentication nonce
- `POST /api/siwe/verify` - Verify signed message

### Token Endpoints

- `POST /api/tokens/mint` - Mint tokens (Oracle only)
- `GET /api/tokens/[address]` - Get token information
- `GET /api/tokens/[address]/metrics` - Get token metrics

### Binding Endpoints

- `POST /api/bindings` - Create wallet binding
- `GET /api/bindings/[wallet]` - Get bindings for wallet
- `PUT /api/bindings/[id]` - Update binding
- `DELETE /api/bindings/[id]` - Deactivate binding

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Need Help?** Open an issue or reach out to the development team for support with SIWE, Thirdweb, or wallet binding integration.