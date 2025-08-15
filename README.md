# XMenity Social Token Platform

> **Production-Ready Social Token Factory for Web3 Creators**

XMenity is an enterprise-grade social token platform that enables content creators and influencers to launch their own tokens based on social media metrics and engagement. Built with Next.js, Prisma, and Web3 technologies.

## 🚀 Features

### Core Platform
- **🔐 Wallet Authentication**: Secure SIWE (Sign-In with Ethereum) authentication
- **🎯 Token Factory**: Deploy ERC-20 social tokens with custom parameters
- **📊 Analytics Dashboard**: Real-time metrics and performance tracking
- **🔗 Social Integration**: Twitter/X and InsightIQ API integration
- **💰 Automated Minting**: Token distribution based on social metrics
- **🏆 Milestone System**: Achievement-based token rewards
- **📱 Mobile-First UI**: Responsive design with modern UX

### Technical Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js server with comprehensive API
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Arbitrum, Thirdweb SDK, ethers.js
- **Authentication**: JWT + SIWE
- **Real-time**: Firebase integration
- **Analytics**: InsightIQ API integration

### Security & Production Features
- **🛡️ Security Headers**: Helmet.js, CSP, CORS configuration
- **⚡ Rate Limiting**: Express rate limiter with Redis support
- **🔒 Environment Validation**: Comprehensive environment configuration
- **📦 Docker Support**: Multi-stage builds for production deployment
- **🔄 Health Checks**: Built-in monitoring and diagnostics
- **📈 Error Handling**: Structured logging and error tracking

## 🏗️ Architecture

### Frontend Architecture
```
app/
├── api/                    # Next.js API routes
│   ├── auth/              # Authentication endpoints
│   ├── tokens/            # Token management
│   ├── analytics/         # Analytics endpoints
│   └── user/              # User management
├── explore/               # Token discovery
├── launch/                # Token creation
└── components/            # Reusable UI components
```

### Backend Server
```
server/
└── index.js              # Express.js production server
    ├── Authentication     # JWT + SIWE verification
    ├── Rate Limiting      # Request throttling
    ├── Security          # Helmet, CORS, CSP
    └── API Routes        # RESTful endpoints
```

### Database Schema
```
📊 Production-Grade Prisma Schema
├── Users              # Creator profiles & authentication
├── Tokens             # Social token contracts
├── TokenHoldings      # User balances
├── Transactions       # Blockchain transactions
├── Milestones         # Achievement tracking
├── Rewards            # Token distributions
├── Notifications      # Real-time alerts
└── Analytics          # Performance metrics
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Firebase project
- Thirdweb API key
- InsightIQ API access (optional)

### Installation

1. **Clone & Install**
```bash
git clone https://github.com/DiamondzShadow/XMenity-Vercel.git
cd XMenity-Vercel
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Configure your environment variables
```

3. **Database Setup**
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. **Development**
```bash
# Start frontend
npm run dev

# Start backend server (separate terminal)
npm run server:dev
```

5. **Production Build**
```bash
npm run build
npm start
```

## 🔧 Configuration

### Required Environment Variables

**Database & Authentication**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/xmenity"
JWT_SECRET="your-secure-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
```

**Blockchain & Web3**
```env
THIRDWEB_CLIENT_ID="your-thirdweb-client-id"
FACTORY_CONTRACT_ADDRESS="0x..."
ARBITRUM_RPC_URL="https://arb1.arbitrum.io/rpc"
PRIVATE_KEY="your-deployment-private-key"
```

**Firebase Integration**
```env
FIREBASE_PROJECT_ID="your-firebase-project"
FIREBASE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

**Social Media APIs**
```env
TWITTER_BEARER_TOKEN="your-twitter-v2-bearer-token"
INSIGHTIQ_API_KEY="your-insightiq-api-key"
```

## 🚀 Deployment

### Vercel Deployment
```bash
# Deploy to Vercel
vercel --prod

# Configure environment variables in Vercel dashboard
```

### Docker Deployment
```bash
# Build production image
docker build -t xmenity-app .

# Run with docker-compose
docker-compose up -d
```

### VM Deployment
```bash
# Use the automated deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 📊 Token Economics

### Minting Rules
- **Per Follower**: Mint tokens based on follower count
- **Milestone Based**: Reward achievement of specific goals
- **Manual**: Creator-controlled token distribution
- **Engagement**: Reward based on interaction metrics

### Influence Tiers
- **Mega Influencer**: 100K+ followers, 80+ influence score
- **Macro Influencer**: 10K+ followers, 70+ influence score  
- **Micro Influencer**: 1K+ followers, 60+ influence score
- **Nano Influencer**: 100+ followers, 40+ influence score

## 🔌 API Documentation

### Authentication
```javascript
// Get nonce for signing
POST /api/auth/nonce
{
  "walletAddress": "0x..."
}

// Verify signature and get JWT
POST /api/auth/verify
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "Sign-in message"
}
```

### Token Management
```javascript
// Create new token
POST /api/tokens
Headers: { Authorization: "Bearer <jwt>" }
{
  "name": "CreatorCoin",
  "symbol": "CREATE",
  "description": "My social token",
  "contractAddress": "0x...",
  "mintingRule": "per_follower"
}

// Get tokens with pagination
GET /api/tokens?page=1&limit=10&search=creator
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📈 Monitoring & Analytics

### Built-in Analytics
- Token performance tracking
- User engagement metrics
- Transaction monitoring
- Real-time notifications
- Revenue analytics

### External Integrations
- **InsightIQ**: Social media influence scoring
- **Firebase**: Real-time database & analytics
- **Thirdweb**: Blockchain infrastructure
- **Twitter API**: Social media data

## 🛡️ Security

### Authentication Security
- JWT with secure secrets
- SIWE signature verification
- Rate limiting per IP
- Wallet-based authentication

### Data Protection
- Environment variable validation
- SQL injection prevention (Prisma)
- XSS protection headers
- CORS configuration

### Smart Contract Security
- Audited token factory contracts
- Multi-sig wallet support
- Emergency pause functionality
- Upgrade protection

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📚 Documentation

- [Quick Start Guide](./QUICK_START_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [API Documentation](./INTEGRATION_ARCHITECTURE.md)
- [Smart Contract Docs](./TOKEN_FACTORY_DEPLOYMENT.md)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/DiamondzShadow/XMenity-Vercel/issues)
- **Discord**: [Join our community](https://discord.gg/xmenity)
- **Email**: development@diamondzshadow.com

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] NFT integration
- [ ] Advanced analytics dashboard
- [ ] Creator marketplace
- [ ] Governance token features

---

**Built with ❤️ by the XMenity Team**

*Empowering creators in the Web3 economy*
