# 🚀 Oracle Service Deployment Guide

Complete guide for deploying the Social Token Oracle service to GCP, Vercel, Replit, or any cloud platform.

## 📋 Prerequisites

- Node.js 16+ installed
- Thirdweb account and client ID
- Oracle wallet with ETH on Arbitrum
- InsightIQ API access
- Smart contracts deployed on Arbitrum

## 🔧 Environment Setup

### 1. Clone and Setup

```bash
# Navigate to oracle service directory
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 2. Required Environment Variables

```env
# Core Configuration
THIRDWEB_CLIENT_ID=your_client_id_from_thirdweb_portal
ORACLE_PRIVATE_KEY=0x...your_oracle_wallet_private_key
ORACLE_API_SECRET=your_super_secure_random_string
SOCIAL_TOKEN_FACTORY_ADDRESS=0x...your_deployed_factory_address

# InsightIQ API
INSIGHTIQ_API_KEY=your_insightiq_api_key

# Network
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
```

### 3. Test Locally

```bash
# Start development server
npm run dev

# Test health endpoint
curl http://localhost:3001/health

# Test authentication
curl -H "Authorization: Bearer your_oracle_api_secret" \
     http://localhost:3001/api/test
```

## 🌐 Deployment Options

### Option 1: Google Cloud Platform (GCP)

#### Setup GCP Project

```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
gcloud init

# Create new project
gcloud projects create social-token-oracle --name="Social Token Oracle"
gcloud config set project social-token-oracle

# Enable required APIs
gcloud services enable appengine.googleapis.com
```

#### Deploy to App Engine

```bash
# Deploy using app.yaml configuration
gcloud app deploy app.yaml

# Set environment variables
gcloud app deploy --set-env-vars ORACLE_PRIVATE_KEY=0x...,ORACLE_API_SECRET=...

# View logs
gcloud app logs tail -s oracle-service
```

#### Using Secret Manager (Recommended)

```bash
# Create secrets
echo -n "0x...private_key" | gcloud secrets create oracle-private-key --data-file=-
echo -n "your_api_secret" | gcloud secrets create oracle-api-secret --data-file=-

# Grant access to App Engine
gcloud secrets add-iam-policy-binding oracle-private-key \
    --member="serviceAccount:social-token-oracle@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### Option 2: Vercel Deployment

#### Setup Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add ORACLE_PRIVATE_KEY
vercel env add ORACLE_API_SECRET
vercel env add THIRDWEB_CLIENT_ID
```

#### Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [{ "src": "oracle-service.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "/oracle-service.js" }]
}
```

### Option 3: Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Set environment variables
railway variables set ORACLE_PRIVATE_KEY=0x...
railway variables set ORACLE_API_SECRET=your_secret

# Deploy
railway up
```

### Option 4: Replit Deployment

1. Fork the repository to Replit
2. Set environment variables in Replit Secrets:
   - `ORACLE_PRIVATE_KEY`
   - `ORACLE_API_SECRET`
   - `THIRDWEB_CLIENT_ID`
3. Click "Run" to start the service
4. Use the provided URL for webhooks

### Option 5: Docker Deployment

```bash
# Build Docker image
docker build -t social-token-oracle .

# Run container
docker run -p 3001:3001 \
  -e ORACLE_PRIVATE_KEY=0x... \
  -e ORACLE_API_SECRET=... \
  -e THIRDWEB_CLIENT_ID=... \
  social-token-oracle

# Or use docker-compose
docker-compose up -d
```

## 🧪 Testing the Deployment

### 1. Health Check

```bash
curl https://your-deployed-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "oracle": "0x...oracle_address"
}
```

### 2. Test Webhook Endpoint

```bash
curl -X POST https://your-deployed-url.com/webhook/account-connected \
  -H "Authorization: Bearer your_oracle_api_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "test_twitter_123456",
    "user_id": "test_user",
    "platform": "twitter"
  }'
```

### 3. Test Manual Mint

```bash
curl -X POST https://your-deployed-url.com/api/factory/mint \
  -H "Authorization: Bearer your_oracle_api_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientAddress": "0x742d35Cc6641Bb8b2a0b9b4F7c4a2a3E3a2E2E2E",
    "amount": "1"
  }'
```

### 4. Test Token Info

```bash
curl https://your-deployed-url.com/api/token/0x...token_address
```

## 🔐 Security Best Practices

### 1. Environment Variables Security

```bash
# Never commit secrets to git
echo ".env" >> .gitignore
echo "*.env.*" >> .gitignore

# Use platform-specific secret management
# GCP: Secret Manager
# Vercel: Environment Variables
# Railway: Railway Variables
```

### 2. API Key Rotation

```bash
# Generate new API secret
openssl rand -hex 32

# Update in environment
# Restart service
```

### 3. Wallet Security

- Use a dedicated oracle wallet
- Fund with minimal ETH needed for gas
- Monitor wallet balance and transactions
- Set up alerts for unusual activity

### 4. Rate Limiting

The service includes built-in rate limiting:
- 100 requests per 15 minutes per IP
- Configurable via environment variables

## 📊 Monitoring & Logging

### 1. Health Monitoring

```bash
# Set up uptime monitoring
curl -X POST https://api.uptimerobot.com/v2/newMonitor \
  -d "api_key=your_api_key" \
  -d "friendly_name=Social Token Oracle" \
  -d "url=https://your-deployed-url.com/health" \
  -d "type=1"
```

### 2. Error Tracking

```env
# Add Sentry for error tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 3. Log Analysis

```bash
# GCP: View logs
gcloud app logs tail -s oracle-service

# Vercel: View function logs
vercel logs

# Railway: View deployment logs
railway logs
```

## 🔧 Configuration Examples

### Production Environment

```env
NODE_ENV=production
PORT=8080
ORACLE_API_SECRET=super_secure_64_char_random_string
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
LOG_LEVEL=warn
```

### Development Environment

```env
NODE_ENV=development
PORT=3001
ORACLE_API_SECRET=dev_secret_for_testing
RATE_LIMIT_MAX_REQUESTS=1000
LOG_LEVEL=debug
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Oracle SDK initialization failed"
```bash
# Check private key format
echo $ORACLE_PRIVATE_KEY | cut -c1-2  # Should be "0x"

# Check network connectivity
curl https://arb1.arbitrum.io/rpc -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'
```

#### 2. "Contract interaction failed"
```bash
# Verify contract address
echo $SOCIAL_TOKEN_FACTORY_ADDRESS

# Check oracle wallet balance
# Visit https://arbiscan.io/address/YOUR_ORACLE_ADDRESS
```

#### 3. "InsightIQ API error"
```bash
# Test API key
curl -H "Authorization: Basic $INSIGHTIQ_API_KEY" \
  "https://api.staging.insightiq.ai/v1/profiles?account_id=test"
```

### Debug Mode

```env
# Enable debug logging
LOG_LEVEL=debug
DEBUG=oracle:*
```

## 📈 Scaling Considerations

### 1. Database Integration

For production, replace the mock wallet binding functions:

```javascript
// Replace getWalletBindings() with actual database queries
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getWalletBindings(platformUserId) {
  return await prisma.walletXBinding.findMany({
    where: { platformUserId, isActive: true }
  });
}
```

### 2. Queue System

For high volume, add a queue system:

```bash
npm install bull redis
```

```javascript
const Queue = require('bull');
const mintQueue = new Queue('token minting', process.env.REDIS_URL);

// Add job to queue instead of immediate processing
mintQueue.add('mint', { walletAddress, amount });
```

### 3. Load Balancing

- Use multiple oracle instances
- Implement round-robin minting
- Monitor gas price and optimize

## 🔄 Continuous Deployment

### GitHub Actions (Example)

```yaml
# .github/workflows/deploy.yml
name: Deploy Oracle Service
on:
  push:
    branches: [main]
    paths: ['server/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v0
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
      - run: gcloud app deploy server/app.yaml
```

## 📞 Support

- **Issues**: Open GitHub issue
- **Documentation**: Check INTEGRATION_GUIDE.md
- **Community**: Join Discord/Telegram

---

**🎉 Your Oracle service is now ready for production!**

The service will automatically:
- ✅ Handle X account connection webhooks
- ✅ Mint tokens based on follower count
- ✅ Update contract metadata
- ✅ Prevent double-minting (Sybil protection)
- ✅ Scale automatically with your platform

**Next Steps**: Set up monitoring, configure webhooks, and start receiving real users!