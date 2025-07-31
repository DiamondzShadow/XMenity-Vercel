# 🚀 Deployment Guide for XMenity Social Token Factory

## 📋 Prerequisites

Before deploying, ensure you have:
- Git installed and configured
- GitHub repository access
- VM with Node.js 18+ installed
- PostgreSQL database setup
- Firebase project configured

## 🔧 Step 1: Push to GitHub

### 1.1 Initialize Git (if not already done)
\`\`\`bash
git init
git remote add origin https://github.com/DiamondzShadow/XMenity-Vercel.git
\`\`\`

### 1.2 Stage All Files
\`\`\`bash
# Add all the new production files
git add .
\`\`\`

### 1.3 Commit Changes
\`\`\`bash
git commit -m "feat: upgrade to production-grade social token platform

- Add comprehensive Web3 integration (Thirdweb, Wagmi, RainbowKit)
- Implement secure SIWE authentication with JWT
- Add PostgreSQL database with Prisma ORM
- Create Express.js backend with security middleware
- Add Docker support with multi-stage builds
- Implement rate limiting and error handling
- Add comprehensive environment configuration
- Create wallet connection and authentication components
- Add production-ready Next.js configuration
- Implement health checks and monitoring"
\`\`\`

### 1.4 Push to GitHub
\`\`\`bash
# Push to main branch
git push -u origin main

# Or if you prefer a feature branch first
git checkout -b production-upgrade
git push -u origin production-upgrade
\`\`\`

## 🖥️ Step 2: VM Backend Setup

### 2.1 Clone Repository on VM
\`\`\`bash
# SSH into your VM
ssh username@your-vm-ip

# Clone the repository
git clone https://github.com/DiamondzShadow/XMenity-Vercel.git
cd XMenity-Vercel
\`\`\`

### 2.2 Install Dependencies
\`\`\`bash
# Install Node.js 18+ if not installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install project dependencies
pnpm install
\`\`\`

### 2.3 Configure Environment
\`\`\`bash
# Copy environment template
cp .env.example .env

# Edit with your specific configuration
nano .env
\`\`\`

Add your configuration:
\`\`\`env
# Firebase Configuration
FIREBASE_PROJECT_ID=diamond-zminter
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@diamond-zminter.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://diamond-zminter-default-rtdb.firebaseio.com
FIREBASE_STORAGE_BUCKET=diamond-zminter.firebasestorage.app
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long
JWT_EXPIRES_IN=3285d

# Thirdweb Configuration
THIRDWEB_CLIENT_ID=5a25f41eddec1fb56418abe1ecef5dc2
THIRDWEB_SECRET_KEY=fkLp8CcF8LZ-b89hnef5rsud5e1A5pOeYgpci6Q4PifvE_4M4SeIdEkP2VhBslstSZRVXWYpHd4RmTbrycEqVg

# InsightIQ Configuration
INSIGHTIQ_CLIENT_ID=62b74562-505d-4062-aa18-8ed30298b243
INSIGHTIQ_CLIENT_SECRET=f1a58605-ae7e-4450-8c92-3ada5dfcaabd
INSIGHTIQ_BASE_URL=https://api.staging.insightiq.ai/v1

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/social_tokens

# Smart Contract Configuration
ARBITRUM_RPC_URL=https://nameless-solemn-cherry.arbitrum-mainnet.quiknode.pro/a30fa1bc3689f3c94015f038c6bb30c0a3826555/
SOCIAL_TOKEN_FACTORY_ADDRESS=0x2AF9605d00E61Aa38a40562B651227b59c506275

# Application Configuration
NODE_ENV=production
PORT=3001
VM_HOST=0.0.0.0
CORS_ORIGIN=*
\`\`\`

### 2.4 Setup Database
\`\`\`bash
# Install PostgreSQL if not installed
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE social_tokens;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE social_tokens TO your_username;
\q

# Generate Prisma client and push schema
pnpm db:generate
pnpm db:push
\`\`\`

### 2.5 Start Backend Server
\`\`\`bash
# Build the application
pnpm build

# Start the backend server
pnpm server

# Or use PM2 for production (recommended)
npm install -g pm2
pm2 start server/index.js --name "xmenity-backend"
pm2 startup
pm2 save
\`\`\`

## 🌐 Step 3: Frontend Deployment (Vercel)

### 3.1 Connect to Vercel
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
\`\`\`

### 3.2 Configure Environment Variables in Vercel
Add these in your Vercel dashboard:
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
- `NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_ARBITRUM_RPC_URL`
- `NEXT_PUBLIC_API_URL` (your VM backend URL)

## 🔒 Step 4: Security Setup

### 4.1 Configure Firewall
\`\`\`bash
# Allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 3001  # Backend API
sudo ufw allow 5432  # PostgreSQL (if external access needed)
sudo ufw enable
\`\`\`

### 4.2 Setup SSL Certificate (Let's Encrypt)
\`\`\`bash
sudo apt install certbot nginx
sudo certbot --nginx -d your-domain.com
\`\`\`

### 4.3 Configure Nginx Reverse Proxy
\`\`\`bash
# Create nginx config
sudo nano /etc/nginx/sites-available/xmenity-backend

# Add configuration:
server {
    listen 80;
    server_name your-api-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/xmenity-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
\`\`\`

## 📊 Step 5: Monitoring Setup

### 5.1 Setup Logging
\`\`\`bash
# Create logs directory
mkdir -p logs

# Configure PM2 logs
pm2 logs xmenity-backend
\`\`\`

### 5.2 Health Check Setup
\`\`\`bash
# Test health endpoint
curl http://localhost:3001/health
\`\`\`

## 🧪 Step 6: Testing

### 6.1 Test Backend API
\`\`\`bash
# Test health endpoint
curl http://your-vm-ip:3001/health

# Test authentication endpoint
curl -X POST http://your-vm-ip:3001/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x1234567890123456789012345678901234567890"}'
\`\`\`

### 6.2 Test Frontend Connection
- Open your Vercel deployment URL
- Try connecting a wallet
- Test the authentication flow

## 🔧 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   \`\`\`bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Restart if needed
   sudo systemctl restart postgresql
   \`\`\`

2. **Port Already in Use**
   \`\`\`bash
   # Find process using port 3001
   sudo lsof -i :3001
   
   # Kill the process
   sudo kill -9 <PID>
   \`\`\`

3. **Environment Variables Not Loading**
   \`\`\`bash
   # Check .env file exists and has correct permissions
   ls -la .env
   chmod 600 .env
   \`\`\`

4. **Prisma Connection Issues**
   \`\`\`bash
   # Reset and regenerate
   pnpm db:generate
   pnpm db:push
   \`\`\`

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs xmenity-backend`
2. Verify environment variables are set correctly
3. Ensure all ports are open and accessible
4. Check database connectivity

## 🎉 Success!

Once deployed, your production-grade social token platform will be running with:
- ✅ Secure backend API on your VM
- ✅ Frontend deployed on Vercel
- ✅ Database persistence with PostgreSQL
- ✅ Web3 integration with Arbitrum
- ✅ Firebase integration for additional services
- ✅ Comprehensive monitoring and logging
