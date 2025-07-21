#!/bin/bash

# XMenity Social Token Factory - Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 XMenity Social Token Factory - Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    print_success "Git repository initialized"
fi

# Check if remote exists and update to correct repo
if git remote get-url origin &> /dev/null; then
    print_status "Updating GitHub remote to correct repository..."
    git remote set-url origin https://github.com/DiamondzShadow/XMenity-Vercel.git
    print_success "GitHub remote updated to XMenity-Vercel"
else
    print_status "Adding GitHub remote..."
    git remote add origin https://github.com/DiamondzShadow/XMenity-Vercel.git
    print_success "GitHub remote added"
fi

# Generate JWT secret if not provided
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    
    # Generate a secure JWT secret
    JWT_SECRET=$(openssl rand -base64 48 2>/dev/null || head -c 48 /dev/urandom | base64)
    sed -i "s/your_jwt_secret_key_minimum_32_characters_long_here/$JWT_SECRET/" .env
    
    print_warning "Please edit .env file with your specific configuration before running the server!"
    print_warning "Important: Add your Firebase private key and other secrets"
fi

# Stage all files
print_status "Staging files for commit..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    # Commit changes
    print_status "Committing changes..."
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
- Add Firebase integration for diamond-zminter project
- Implement health checks and monitoring
- Add deployment automation scripts

This upgrade transforms the repository into an enterprise-grade
social token platform ready for production deployment on Vercel."
    
    print_success "Changes committed"
fi

# Push to GitHub
print_status "Pushing to GitHub (XMenity-Vercel)..."
if git push -u origin main 2>&1; then
    print_success "Successfully pushed to GitHub!"
else
    print_warning "Push failed. Trying to push to a new branch..."
    BRANCH_NAME="production-upgrade-$(date +%Y%m%d-%H%M%S)"
    git checkout -b "$BRANCH_NAME"
    git push -u origin "$BRANCH_NAME"
    print_success "Pushed to new branch: $BRANCH_NAME"
    print_warning "Please create a pull request to merge into main branch"
fi

# Display next steps
echo ""
print_success "🎉 Deployment to GitHub completed!"
echo ""
print_success "🔗 Repository: https://github.com/DiamondzShadow/XMenity-Vercel"
echo ""
echo "📋 Next Steps:"
echo "==============="
echo ""
echo "1. 🔧 Configure Environment Variables:"
echo "   - Edit .env file with your specific configuration"
echo "   - Add your Firebase private key"
echo "   - Set up database connection string"
echo ""
echo "2. 🖥️  VM Backend Setup:"
echo "   - SSH into your VM"
echo "   - Clone the repository: git clone https://github.com/DiamondzShadow/XMenity-Vercel.git"
echo "   - Follow the instructions in DEPLOYMENT_GUIDE.md"
echo ""
echo "3. 🌐 Frontend Deployment:"
echo "   - Connect to Vercel: vercel --prod"
echo "   - Configure environment variables in Vercel dashboard"
echo ""
echo "4. 🔒 Security Setup:"
echo "   - Configure firewall on VM"
echo "   - Set up SSL certificate"
echo "   - Configure Nginx reverse proxy"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - DEPLOYMENT_GUIDE.md"
echo "   - README.md"
echo ""
print_success "Happy deploying! 🚀"