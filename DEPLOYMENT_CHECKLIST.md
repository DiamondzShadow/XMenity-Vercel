# ✅ XMenity Social Token Factory - Deployment Checklist

## 🎯 Quick Deployment Commands

### 1. Push to GitHub (Automated)
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run automated deployment script
./scripts/deploy.sh
```

### 2. Manual Git Commands (Alternative)
```bash
# Initialize and add remote
git init
git remote add origin https://github.com/DiamondzShadow/XMenity-Tube.git

# Stage and commit all files
git add .
git commit -m "feat: upgrade to production-grade social token platform"

# Push to GitHub
git push -u origin main
```

## 🔧 Environment Configuration Checklist

### ✅ Firebase Configuration (Your Settings)
```env
FIREBASE_PROJECT_ID=diamond-zminter
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@diamond-zminter.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://diamond-zminter-default-rtdb.firebaseio.com
FIREBASE_STORAGE_BUCKET=diamond-zminter.firebasestorage.app
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[YOUR_PRIVATE_KEY]\n-----END PRIVATE KEY-----\n"
```

### ✅ Thirdweb Configuration (Your Settings)
```env
THIRDWEB_CLIENT_ID=5a25f41eddec1fb56418abe1ecef5dc2
THIRDWEB_SECRET_KEY=fkLp8CcF8LZ-b89hnef5rsud5e1A5pOeYgpci6Q4PifvE_4M4SeIdEkP2VhBslstSZRVXWYpHd4RmTbrycEqVg
```

### ✅ InsightIQ Configuration (Your Settings)
```env
INSIGHTIQ_CLIENT_ID=62b74562-505d-4062-aa18-8ed30298b243
INSIGHTIQ_CLIENT_SECRET=f1a58605-ae7e-4450-8c92-3ada5dfcaabd
INSIGHTIQ_BASE_URL=https://api.staging.insightiq.ai/v1
```

### ✅ Smart Contract Configuration (Your Settings)
```env
ARBITRUM_RPC_URL=https://nameless-solemn-cherry.arbitrum-mainnet.quiknode.pro/a30fa1bc3689f3c94015f038c6bb30c0a3826555/
SOCIAL_TOKEN_FACTORY_ADDRESS=0x2AF9605d00E61Aa38a40562B651227b59c506275
CHAIN_ID=42161
```

### ⚠️ Required Manual Configuration
```env
# Generate a secure JWT secret (32+ characters)
JWT_SECRET=[GENERATE_SECURE_SECRET]

# Database connection (set up PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/social_tokens

# Application URLs (update with your domains)
FRONTEND_URL=https://your-frontend-domain.com
NEXTAUTH_URL=https://your-frontend-domain.com

# Admin wallet (add your admin private key)
ADMIN_WALLET_PRIVATE_KEY=[YOUR_ADMIN_PRIVATE_KEY]
ADMIN_WALLET_ADDRESS=[YOUR_ADMIN_WALLET_ADDRESS]
```

## 🖥️ VM Backend Deployment Steps

### 1. Server Setup
```bash
# SSH into your VM
ssh username@your-vm-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
```

### 2. Database Setup
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE social_tokens;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE social_tokens TO your_username;
\q
```

### 3. Application Deployment
```bash
# Clone repository
git clone https://github.com/DiamondzShadow/XMenity-Tube.git
cd XMenity-Tube

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
nano .env  # Edit with your configuration

# Setup database
pnpm db:generate
pnpm db:push

# Start with PM2 (production)
npm install -g pm2
pm2 start server/index.js --name "xmenity-backend"
pm2 startup
pm2 save
```

### 4. Security & Networking
```bash
# Configure firewall
sudo ufw allow 22    # SSH
sudo ufw allow 3001  # Backend API
sudo ufw enable

# Install and configure Nginx
sudo apt install nginx
sudo nano /etc/nginx/sites-available/xmenity-backend

# Enable SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-api-domain.com
```

## 🌐 Frontend Deployment (Vercel)

### 1. Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. Vercel Environment Variables
Configure these in your Vercel dashboard:
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID=5a25f41eddec1fb56418abe1ecef5dc2`
- `NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS=0x2AF9605d00E61Aa38a40562B651227b59c506275`
- `NEXT_PUBLIC_ARBITRUM_RPC_URL=https://nameless-solemn-cherry.arbitrum-mainnet.quiknode.pro/a30fa1bc3689f3c94015f038c6bb30c0a3826555/`
- `NEXT_PUBLIC_API_URL=https://your-api-domain.com`

## 🔍 Testing & Verification

### ✅ Backend Health Checks
```bash
# Test health endpoint
curl https://your-api-domain.com/health

# Test authentication
curl -X POST https://your-api-domain.com/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x1234567890123456789012345678901234567890"}'
```

### ✅ Frontend Testing
- [ ] Open Vercel deployment URL
- [ ] Connect wallet (MetaMask/WalletConnect)
- [ ] Test authentication flow
- [ ] Verify Web3 interactions
- [ ] Test responsive design

### ✅ Firebase Integration Testing
- [ ] User profile creation
- [ ] Token tracking
- [ ] Transaction logging
- [ ] Real-time updates
- [ ] File uploads

## 📊 Monitoring & Maintenance

### 1. Application Monitoring
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs xmenity-backend

# Monitor resources
pm2 monit
```

### 2. Database Monitoring
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Connect to database
psql -U your_username -d social_tokens
```

### 3. Nginx Monitoring
```bash
# Check Nginx status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log
```

## 🚨 Troubleshooting

### Common Issues & Solutions

1. **Database Connection Failed**
   ```bash
   sudo systemctl restart postgresql
   ```

2. **Port 3001 Already in Use**
   ```bash
   sudo lsof -i :3001
   sudo kill -9 <PID>
   ```

3. **PM2 Process Issues**
   ```bash
   pm2 restart xmenity-backend
   pm2 delete xmenity-backend
   pm2 start server/index.js --name "xmenity-backend"
   ```

4. **Nginx Configuration Issues**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## 🎉 Success Indicators

### ✅ Backend Success
- [ ] Health endpoint returns 200
- [ ] Authentication endpoints working
- [ ] Database connected and migrations applied
- [ ] PM2 process running stably
- [ ] Nginx proxy working
- [ ] SSL certificate installed

### ✅ Frontend Success
- [ ] Vercel deployment successful
- [ ] Wallet connection working
- [ ] Authentication flow complete
- [ ] API communication established
- [ ] Responsive design functional

### ✅ Integration Success
- [ ] Firebase services connected
- [ ] Smart contract interactions working
- [ ] InsightIQ API integration functional
- [ ] Real-time updates working
- [ ] Token creation and management working

## 📞 Support Resources

- **Documentation**: See `DEPLOYMENT_GUIDE.md` for detailed instructions
- **GitHub Repository**: https://github.com/DiamondzShadow/XMenity-Tube
- **Issues**: Create GitHub issues for bugs and feature requests
- **Logs**: Always check PM2 logs first: `pm2 logs xmenity-backend`

---

**🚀 You now have a production-grade social token platform!**

The platform includes:
- ✅ Secure Web3 authentication
- ✅ PostgreSQL database with comprehensive schema
- ✅ Express.js backend with security middleware
- ✅ Next.js frontend with modern UI
- ✅ Firebase integration for additional services
- ✅ Smart contract integration on Arbitrum
- ✅ Production-ready deployment configuration