# XMenity Social Token Factory 🚀

A production-grade platform for X (Twitter) creators to launch their own community tokens on Arbitrum, powered by InsightIQ verification and milestone-based tokenomics.

## 🌟 Features

### Core Platform
- **Web3 Integration**: Full Wagmi, RainbowKit, and Thirdweb integration
- **Wallet Authentication**: Secure SIWE (Sign-In With Ethereum) authentication
- **Multi-Chain Support**: Built on Arbitrum with extensible chain support
- **Database Management**: PostgreSQL with Prisma ORM for data persistence

### Smart Contract Integration
- **Token Factory**: Deploy custom ERC-20 tokens with milestone mechanics
- **Contract Address**: `0x2AF9605d00E61Aa38a40562B651227b59c506275` (Arbitrum One)
- **Automated Minting**: Milestone-based token distribution
- **Identity NFTs**: Soulbound tokens for creator verification

### Social Media Features
- **InsightIQ Integration**: Verified creator authentication
- **Twitter API**: Real-time follower and engagement tracking
- **Milestone System**: Reward followers based on creator achievements
- **Anti-Sybil Protection**: Verified social media accounts only

### Production Features
- **Security Headers**: Comprehensive security middleware
- **Rate Limiting**: API protection against abuse
- **Error Handling**: Graceful error management and logging
- **Health Monitoring**: Built-in health checks and metrics
- **Type Safety**: Full TypeScript implementation

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **Radix UI** components
- **Framer Motion** for animations

### Web3
- **Thirdweb SDK** for contract interactions
- **Wagmi & Viem** for Web3 state management
- **RainbowKit** for wallet connections
- **SIWE** for authentication

### Backend
- **Express.js** API server
- **PostgreSQL** database
- **Prisma ORM** for database management
- **JWT** authentication
- **Helmet** for security

### DevOps
- **Docker** support
- **GitHub Actions** CI/CD
- **Vercel** deployment ready
- **Environment validation**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database
- Wallet with Arbitrum network
- InsightIQ API access (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/DiamondzShadow/XMenity-Tube.git
cd XMenity-Tube

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
pnpm db:generate
pnpm db:push

# Start development servers
pnpm dev        # Frontend (port 3000)
pnpm dev:server # Backend (port 3001)
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/social_tokens"

# Thirdweb
THIRDWEB_CLIENT_ID="your_thirdweb_client_id"
THIRDWEB_SECRET_KEY="your_thirdweb_secret_key"

# Contract Configuration
FACTORY_CONTRACT_ADDRESS="0x2AF9605d00E61Aa38a40562B651227b59c506275"
ADMIN_WALLET_PRIVATE_KEY="your_admin_private_key"

# InsightIQ (Optional)
INSIGHTIQ_API_KEY="your_insightiq_api_key"
INSIGHTIQ_BASE_URL="https://api.staging.insightiq.ai/v1"

# Authentication
JWT_SECRET="your_jwt_secret_key_minimum_32_characters_long"
NEXTAUTH_SECRET="your_nextauth_secret_key"

# Application
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

## 📱 User Journey

### For Creators
1. **Connect Wallet** → Use MetaMask or other Web3 wallet
2. **Verify Identity** → Link X (Twitter) account via InsightIQ
3. **Deploy Token** → Create custom ERC-20 with tokenomics
4. **Set Milestones** → Define follower/engagement goals
5. **Reward Community** → Automatic token distribution

### For Followers
1. **Connect Wallet** → Link Web3 wallet to receive tokens
2. **Follow Creator** → Automatically receive tokens for following
3. **Engage Content** → Earn additional tokens for interactions
4. **Hold & Trade** → Use tokens in creator's ecosystem

## 🏗️ Architecture

### Smart Contracts
```
Factory Contract (Arbitrum)
├── Token Creation
├── Milestone Management
├── Reward Distribution
└── Identity Verification
```

### Backend Services
```
Express API Server
├── Authentication (JWT + SIWE)
├── Database Management (Prisma)
├── Social Media Integration
├── Blockchain Monitoring
└── Rate Limiting & Security
```

### Frontend Components
```
Next.js Application
├── Web3 Providers (Wagmi + RainbowKit)
├── Authentication Flow
├── Token Dashboard
├── Creator Tools
└── Analytics
```

## 🔒 Security Features

- **SIWE Authentication**: Cryptographic wallet verification
- **JWT Tokens**: Secure session management
- **Rate Limiting**: API abuse prevention
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive data validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

## 📊 Database Schema

The platform uses a comprehensive PostgreSQL schema with the following key models:

- **Users**: Wallet addresses, social media data, verification status
- **Tokens**: ERC-20 token metadata and economics
- **Transactions**: On-chain transaction tracking
- **Milestones**: Creator achievement goals
- **Rewards**: Token distribution records
- **Activities**: Platform activity logs

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/nonce` - Get authentication nonce
- `POST /api/auth/verify` - Verify signed message

### Users
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Tokens
- `GET /api/tokens` - List all public tokens
- `POST /api/tokens` - Create new token
- `GET /api/tokens/:id` - Get token details

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Record new transaction

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker
```bash
# Build image
docker build -t xmenity-app .

# Run container
docker run -p 3000:3000 xmenity-app
```

### Manual Server
```bash
# Build application
pnpm build

# Start production server
pnpm start
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 📈 Performance Optimizations

- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Redis for session and data caching
- **Database Indexing**: Optimized PostgreSQL indexes
- **Bundle Analysis**: Webpack bundle analyzer integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [docs.xmenity.com](https://docs.xmenity.com)
- **Discord**: [Join Community](https://discord.gg/xmenity)
- **Twitter**: [@XMenityTube](https://twitter.com/XMenityTube)

## 📧 Support

For support, email support@xmenity.com or join our Discord community.

---

**Built with ❤️ by the XMenity Team**

*Empowering creators to build sustainable token economies backed by real social influence.*