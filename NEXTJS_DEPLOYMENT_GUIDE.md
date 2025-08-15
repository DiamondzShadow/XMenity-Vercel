# 🚀 Next.js Deployment Guide for XMenity Social Token Factory

## 📋 Overview

After migrating from Express.js to Next.js API routes, your application now has multiple excellent deployment options. Since v0.dev/Vercel is experiencing issues, here are the best alternatives for deploying your Next.js application with API routes.

## 🌟 Recommended Deployment Platforms

### 1. 🚀 Netlify (Highly Recommended)
**Best for**: Easy deployment with excellent Next.js support and built-in CI/CD

#### Quick Deploy
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the application
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=.next
```

#### Environment Variables for Netlify
Add these in your Netlify dashboard:
```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS=0x2AF9605d00E61Aa38a40562B651227b59c506275
NEXT_PUBLIC_ARBITRUM_RPC_URL=your_arbitrum_rpc_url
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_minimum_32_characters
THIRDWEB_SECRET_KEY=your_thirdweb_secret
```

### 2. 🌊 DigitalOcean App Platform
**Best for**: Simple deployment with database integration

#### Deploy Steps
1. Connect your GitHub repository
2. Select "Next.js" as the framework
3. Configure environment variables
4. Deploy with auto-scaling

#### Configuration
```yaml
# app.yaml
name: xmenity-social-tokens
services:
- name: web
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
databases:
- name: db
  engine: PG
  version: "13"
```

### 3. ☁️ Railway
**Best for**: Developer-friendly deployment with built-in database

#### Deploy Command
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

#### Railway Configuration
Create `railway.toml`:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
restartPolicyType = "always"

[env]
NODE_ENV = "production"
```

### 4. 🔥 Firebase Hosting + Cloud Functions
**Best for**: Google ecosystem integration

#### Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init hosting

# Deploy
firebase deploy
```

#### Firebase Configuration (`firebase.json`)
```json
{
  "hosting": {
    "public": ".next/standalone/public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "function": "nextjsFunc"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

#### Firebase Functions Setup (`functions/index.js`)
```javascript
const { onRequest } = require('firebase-functions/v2/https');
const next = require('next');

const nextjsDistDir = require('path').join(__dirname, '../.next');

const nextjsServer = next({
  dev: false,
  dir: __dirname,
  distDir: nextjsDistDir,
});
const nextjsHandle = nextjsServer.getRequestHandler();

exports.nextjsFunc = onRequest(async (req, res) => {
  return nextjsServer.prepare().then(() => nextjsHandle(req, res));
});
```

**Note**: For `output: 'standalone'` mode, Firebase deployment requires additional setup. Consider using Vercel or Railway for easier deployment with standalone output.

### 5. 🐳 Docker Deployment (Self-Hosted)
**Best for**: Full control and custom infrastructure

Your existing Dockerfile is already optimized for Next.js! Just update the health check:

#### Updated Health Check
```javascript
// healthcheck.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 2000,
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.log('Health check failed');
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.log('Health check failed:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.log('Health check timed out');
  request.destroy();
  process.exit(1);
});

request.end();
```

#### Docker Compose for Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - THIRDWEB_CLIENT_ID=${THIRDWEB_CLIENT_ID}
      - THIRDWEB_SECRET_KEY=${THIRDWEB_SECRET_KEY}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=social_tokens
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

## 🔧 Database Setup Options

### Option 1: Supabase (Recommended)
```bash
# Already configured in your project
# Just update the DATABASE_URL in your environment variables
```

### Option 2: Railway PostgreSQL
```bash
# Automatically provisioned with Railway deployment
# No additional setup required
```

### Option 3: DigitalOcean Managed Database
```bash
# Create managed PostgreSQL database in DigitalOcean
# Use the connection string in your environment variables
```

## 🌐 CDN and Performance Optimization

### Cloudflare Setup (Recommended)
1. Add your domain to Cloudflare
2. Enable these optimizations:
   - Auto Minify (CSS, JS, HTML)
   - Brotli Compression
   - Rocket Loader
   - Image Optimization

### Image Optimization
Your Next.js config already includes image optimization. For external images, add domains:

```javascript
// next.config.mjs
images: {
  domains: [
    'your-cdn-domain.com',
    'assets.example.com'
  ],
  formats: ['image/webp', 'image/avif'],
}
```

## 🔒 Security Considerations

### Environment Variables
Never commit these to your repository:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_super_secure_secret
THIRDWEB_SECRET_KEY=your_secret_key
FIREBASE_PRIVATE_KEY=your_firebase_key
```

### Rate Limiting
Your app now includes rate limiting middleware. For production, consider:
- Redis-based rate limiting
- Cloudflare rate limiting
- Platform-specific rate limiting features

## 📊 Monitoring and Analytics

### Health Checks
All platforms support the health check endpoint:
```
GET /api/health
```

### Logging
Enable structured logging in production:
```javascript
// Add to your API routes
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'Request processed',
  userId: user?.id,
  endpoint: request.url
}));
```

## 🚀 Quick Migration from Current Setup

### From Vercel (if issues persist)
1. Export your environment variables from Vercel
2. Choose a new platform from above
3. Import environment variables
4. Deploy using the platform's method
5. Update your domain DNS

### Testing Checklist
Before going live, test these endpoints:
- [ ] `GET /api/health` - Health check
- [ ] `POST /api/auth/nonce` - Wallet nonce generation
- [ ] `POST /api/auth/verify` - Wallet signature verification
- [ ] `GET /api/user/profile` - User profile (with auth)
- [ ] `GET /api/tokens` - Token listing
- [ ] `POST /api/tokens` - Token creation (with auth)

## 💡 Recommended Stack

For the best experience, I recommend:

1. **Netlify** for deployment (excellent Next.js support)
2. **Supabase** for database (already configured)
3. **Cloudflare** for CDN and DDoS protection
4. **GitHub Actions** for CI/CD automation

This combination provides:
- ✅ Excellent performance
- ✅ Built-in security
- ✅ Auto-scaling
- ✅ Cost-effective
- ✅ Easy maintenance

## 🎯 Next Steps

1. Choose your deployment platform
2. Set up environment variables
3. Deploy your application
4. Configure your domain
5. Set up monitoring
6. Update your frontend API URLs if needed

Your Next.js migration is complete and ready for production! 🎉