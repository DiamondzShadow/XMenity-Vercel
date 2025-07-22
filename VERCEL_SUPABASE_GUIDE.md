# 🚀 Vercel + Supabase Deployment Guide

Complete guide for deploying your Social Token Factory to **Vercel** with **Supabase** as the database backend.

## 🎯 Why Vercel + Supabase?

- ✅ **Perfect Match**: Vercel's serverless functions + Supabase's hosted PostgreSQL
- ✅ **Zero Config**: No database setup or management required
- ✅ **Global Scale**: Both platforms are built for global scale
- ✅ **Cost Effective**: Generous free tiers for development
- ✅ **Developer Experience**: Seamless integration and deployment

## 📋 Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- Supabase account ([supabase.com](https://supabase.com))
- GitHub repository with your code
- Thirdweb account and client ID

## 🏗️ Step 1: Setup Supabase Database

### 1.1 Create Supabase Project

```bash
# Go to supabase.com and create a new project
# Choose a project name, database password, and region
```

### 1.2 Run Database Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **Run** to create all tables and functions

### 1.3 Get API Keys

Navigate to **Settings > API** in your Supabase dashboard:

```env
# Copy these values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.4 Configure Row Level Security (RLS)

The schema automatically enables RLS. Verify in **Authentication > Policies**:

- ✅ Profiles: Public read, service role write
- ✅ Wallet bindings: Public read, service role write  
- ✅ Token mints: Public read, service role insert
- ✅ API keys: Service role only

## 🚀 Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New... > Project"**
3. Import your GitHub repository
4. Choose **Next.js** framework preset

### 2.2 Configure Environment Variables

In Vercel dashboard, go to **Settings > Environment Variables**:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Oracle Configuration
ORACLE_PRIVATE_KEY=0x...your_oracle_private_key
ORACLE_API_SECRET=your_super_secure_api_secret

# Smart Contract
NEXT_PUBLIC_SOCIAL_TOKEN_FACTORY_ADDRESS=0x...your_factory_address

# InsightIQ API
INSIGHTIQ_API_KEY=your_insightiq_api_key

# Network
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# Webhook Security
WEBHOOK_SECRET=your_webhook_secret

# SIWE
SIWE_SECRET=your_siwe_secret
```

### 2.3 Deploy

```bash
# Deploy button in Vercel dashboard
# Or via CLI:
npx vercel --prod
```

## 🔧 Step 3: Test Your Deployment

### 3.1 Health Check

```bash
curl https://your-app.vercel.app/api/health
```

### 3.2 Test Database Connection

```bash
curl https://your-app.vercel.app/api/stats
```

### 3.3 Test Wallet Connection

Visit your deployed app and try the wallet connection flow.

## 📊 Step 4: Monitor and Manage

### 4.1 Supabase Dashboard

Monitor your database at [supabase.com/dashboard](https://supabase.com/dashboard):

- **Database**: View tables and data
- **Auth**: Manage authentication (if using)
- **Storage**: File uploads (if needed)
- **Edge Functions**: Custom serverless functions
- **Logs**: Database query logs

### 4.2 Vercel Dashboard

Monitor your deployment at [vercel.com/dashboard](https://vercel.com/dashboard):

- **Functions**: Serverless function logs
- **Analytics**: Traffic and performance
- **Deployments**: Deployment history
- **Domains**: Custom domain setup

## 🛠️ Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Set up local environment
cp .env.example .env.local
# Fill in your Supabase credentials

# Start development server
npm run dev
```

### Database Changes

1. Update `supabase/schema.sql`
2. Apply changes in Supabase SQL Editor
3. Update TypeScript types in `types/supabase.ts`
4. Deploy to Vercel (automatic on git push)

### Environment Management

```bash
# Production environment variables in Vercel
vercel env add VARIABLE_NAME production

# Development environment variables locally
echo "VARIABLE_NAME=value" >> .env.local
```

## 🔐 Security Best Practices

### 1. Environment Variables

```bash
# Never commit secrets
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore

# Use Vercel environment variables for secrets
# Use NEXT_PUBLIC_ only for client-side values
```

### 2. Supabase Security

```sql
-- Enable RLS on all tables
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies
CREATE POLICY "policy_name" ON table_name FOR SELECT USING (true);
```

### 3. API Route Protection

```typescript
// Protect sensitive API routes
if (request.headers.get('authorization') !== `Bearer ${process.env.ORACLE_API_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## 🚀 Production Optimizations

### 1. Database Performance

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_wallet_bindings_user_id ON wallet_x_bindings(platform_user_id);
CREATE INDEX idx_token_mints_created_at ON token_mints(created_at);
```

### 2. Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=1024"
  }
}
```

### 3. Caching Strategy

```typescript
// Add caching headers to API responses
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
  }
});
```

## 🔄 Scaling Considerations

### Database Scaling

- **Supabase Pro**: Dedicated compute resources
- **Connection Pooling**: Built-in pgBouncer
- **Read Replicas**: For read-heavy workloads
- **Point-in-time Recovery**: For data protection

### Vercel Scaling

- **Concurrent Executions**: Scales automatically
- **Edge Functions**: For global performance
- **Analytics**: Monitor performance bottlenecks
- **Custom Domains**: Professional deployment

## 🧪 Testing Strategy

### Unit Tests

```bash
npm run test
```

### Integration Tests

```typescript
// Test API routes with Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### End-to-End Tests

```bash
# Use Playwright or Cypress
npm run test:e2e
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Supabase client not initialized"

```typescript
// Check environment variables
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10));
```

#### 2. "Row Level Security policy violation"

```sql
-- Check your RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';
```

#### 3. "Function timeout on Vercel"

```json
// Increase timeout in vercel.json
{
  "functions": {
    "app/api/slow-route/**": {
      "maxDuration": 30
    }
  }
}
```

#### 4. "Database connection limit reached"

- Use connection pooling in Supabase
- Optimize database queries
- Consider upgrading Supabase plan

### Debug Mode

```bash
# Enable debug logging
export DEBUG=supabase:*
npm run dev
```

## 📈 Analytics and Monitoring

### Supabase Analytics

- Query performance monitoring
- Database usage metrics
- Real-time subscriptions
- Error tracking

### Vercel Analytics

- Function execution metrics
- Error rates and logs
- Traffic patterns
- Performance insights

### Custom Monitoring

```typescript
// Add custom metrics
import { track } from '@vercel/analytics';

track('wallet_connected', {
  wallet_address: address,
  platform: 'twitter'
});
```

## 🎉 You're Ready!

Your Social Token Factory is now deployed on the **Vercel + Supabase** stack:

✅ **Scalable Database**: Supabase handles all database operations  
✅ **Serverless Functions**: Vercel API routes for webhooks and minting  
✅ **Global Performance**: Edge functions and CDN distribution  
✅ **Real-time Updates**: Supabase real-time subscriptions  
✅ **Production Security**: RLS policies and environment variables  

**Next Steps:**
1. Set up custom domain in Vercel
2. Configure webhook URLs in your platforms
3. Monitor usage and optimize performance
4. Scale up resources as needed

**🚀 Your social token platform is now production-ready on the modern web!**