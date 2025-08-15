# XMenity Tube Frontend

A modern Web3 social token platform built with Next.js, Supabase, and Thirdweb.

## 🚀 Features

- **Social Token Creation**: Deploy milestone-based social tokens with dynamic tokenomics
- **InsightIQ Integration**: Verify influencers and calculate tokenomics based on real social metrics
- **Web3 Integration**: Full blockchain integration with Arbitrum
- **Real-time Analytics**: Track token performance and social metrics
- **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + JWT
- **Storage**: Supabase Storage
- **Blockchain**: Thirdweb, Arbitrum
- **Analytics**: Custom analytics with Supabase

## 📦 Dependencies

### Core Dependencies
- `@supabase/supabase-js` - Supabase client
- `@supabase/auth-helpers-nextjs` - Supabase auth helpers
- `@thirdweb-dev/react` & `@thirdweb-dev/sdk` - Web3 integration
- `@prisma/client` - Database ORM
- `next` - React framework
- `typescript` - Type safety

### UI Components
- `@radix-ui/*` - Headless UI components
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `clsx` & `tailwind-merge` - Conditional styling

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and fill in your configuration:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Secret
JWT_SECRET=your_jwt_secret

# Thirdweb
THIRDWEB_SECRET_KEY=your_thirdweb_key
SOCIAL_TOKEN_FACTORY_ADDRESS=your_factory_address

# InsightIQ
INSIGHTIQ_API_KEY=your_insightiq_key
```

## 🗄️ Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration file to set up your database schema:
   ```sql
   -- Run the contents of supabase/migrations/001_initial_schema.sql
   ```
3. Configure your environment variables with your Supabase credentials

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xmenity-tube-frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your environment variables
   ```

4. **Set up the database**
   - Create a Supabase project
   - Run the migration SQL in your Supabase SQL editor
   - Update your DATABASE_URL in .env.local

5. **Generate Prisma client**
   ```bash
   pnpm db:generate
   ```

6. **Run the development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

```
├── app/                 # Next.js 14 app directory
│   ├── api/            # API routes
│   ├── components/     # Page components
│   └── globals.css     # Global styles
├── components/         # Reusable UI components
├── lib/               # Utility functions and configurations
│   ├── supabase.ts    # Supabase client and operations
│   └── utils.ts       # Helper utilities
├── supabase/          # Database migrations and config
├── types/            # TypeScript type definitions
└── prisma/           # Database schema and migrations
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
\`\`\`javascript
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
\`\`\`

### Token Management
\`\`\`javascript
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
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
\`\`\`

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
