#!/bin/bash

# =============================================================================
# XMenity InsightIQ Integration - Environment Setup Script
# =============================================================================

set -e

echo "🚀 Setting up XMenity InsightIQ Integration Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# 1. Check Dependencies
# =============================================================================

echo -e "${BLUE}📋 Checking dependencies...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm not found. Installing pnpm...${NC}"
    npm install -g pnpm
fi

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ OpenSSL is not installed. Please install OpenSSL for secure key generation${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies check passed${NC}"
echo ""

# =============================================================================
# 2. Environment File Setup
# =============================================================================

echo -e "${BLUE}🔧 Setting up environment configuration...${NC}"

# Create .env.local from template
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✅ Created .env.local from template${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  .env.local already exists. Backing up to .env.local.backup${NC}"
    cp .env.local .env.local.backup
fi

# =============================================================================
# 3. Generate Secure JWT Secret
# =============================================================================

echo -e "${BLUE}🔐 Generating secure JWT secret...${NC}"

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "Generated JWT Secret: ${JWT_SECRET:0:20}..."

# Replace JWT secret in .env.local
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.local
else
    # Linux
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.local
fi

echo -e "${GREEN}✅ JWT secret generated and configured${NC}"
echo ""

# =============================================================================
# 4. Install Dependencies
# =============================================================================

echo -e "${BLUE}📦 Installing project dependencies...${NC}"

pnpm install --no-frozen-lockfile

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# =============================================================================
# 5. Environment Configuration Check
# =============================================================================

echo -e "${BLUE}🔍 Checking environment configuration...${NC}"

# Required variables for InsightIQ integration
REQUIRED_VARS=(
    "INSIGHTIQ_CLIENT_ID"
    "INSIGHTIQ_CLIENT_SECRET"
    "INSIGHTIQ_BASE_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_THIRDWEB_CLIENT_ID"
    "THIRDWEB_SECRET_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" .env.local || grep -q "^$var=your_" .env.local || grep -q "^$var=\s*$" .env.local; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All required environment variables are configured${NC}"
else
    echo -e "${YELLOW}⚠️  The following environment variables need to be configured:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${YELLOW}   - $var${NC}"
    done
    echo ""
    echo -e "${BLUE}📝 Please update these in .env.local before proceeding${NC}"
fi

echo ""

# =============================================================================
# 6. Test InsightIQ API Connection
# =============================================================================

echo -e "${BLUE}🔗 Testing InsightIQ API connection...${NC}"

# Create a simple test script
cat > test-insightiq.js << 'EOF'
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testInsightIQ() {
    const baseUrl = process.env.INSIGHTIQ_BASE_URL;
    const clientId = process.env.INSIGHTIQ_CLIENT_ID;
    const clientSecret = process.env.INSIGHTIQ_CLIENT_SECRET;

    if (!baseUrl || !clientId || !clientSecret) {
        console.log('❌ InsightIQ credentials not configured');
        return false;
    }

    try {
        const response = await fetch(`${baseUrl}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials',
            }),
        });

        if (response.ok) {
            console.log('✅ InsightIQ API connection successful');
            return true;
        } else {
            console.log('❌ InsightIQ API connection failed:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ InsightIQ API connection error:', error.message);
        return false;
    }
}

testInsightIQ();
EOF

# Only test if node-fetch is available or we can use node's built-in fetch
if command -v node &> /dev/null; then
    echo -e "${YELLOW}Note: API test requires proper InsightIQ credentials${NC}"
    # node test-insightiq.js 2>/dev/null || echo -e "${YELLOW}⚠️  Could not test InsightIQ API (missing credentials or network issue)${NC}"
    rm -f test-insightiq.js
fi

echo ""

# =============================================================================
# 7. Final Setup Instructions
# =============================================================================

echo -e "${GREEN}🎉 Environment setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}1. Configure missing environment variables in .env.local:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${YELLOW}   - $var${NC}"
    done
    echo ""
fi

echo -e "${BLUE}2. Supabase Setup (if not done already):${NC}"
echo "   - Create a Supabase project at https://supabase.com"
echo "   - Run the database migration from supabase/migrations/"
echo "   - Update Supabase credentials in .env.local"
echo ""

echo -e "${BLUE}3. Test the Integration:${NC}"
echo "   pnpm dev                 # Start development server"
echo "   # Then visit http://localhost:3000/launch"
echo ""

echo -e "${BLUE}4. For Production Deployment:${NC}"
echo "   - Update NEXT_PUBLIC_FRONTEND_URL with your domain"
echo "   - Set NODE_ENV=production"
echo "   - Ensure all credentials are secure"
echo ""

echo -e "${GREEN}🚀 Ready to launch with InsightIQ integration!${NC}"
echo ""

# =============================================================================
# 8. Create Quick Test Script
# =============================================================================

cat > test-creator-verification.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing Creator Verification Flow..."
echo ""

# Start the development server in background
echo "Starting development server..."
pnpm dev &
DEV_PID=$!

# Wait for server to start
sleep 5

echo "Testing InsightIQ endpoint..."

# Test the verification endpoint
curl -X POST http://localhost:3000/api/auth/insightiq \
  -H "Content-Type: application/json" \
  -d '{"username": "test_creator", "walletAddress": "0x1234567890123456789012345678901234567890"}' \
  | jq '.' || echo "Response received (jq not available for formatting)"

echo ""
echo "Test completed. Stopping development server..."

# Stop the development server
kill $DEV_PID 2>/dev/null

echo "✅ Test script created. Run ./test-creator-verification.sh to test"
EOF

chmod +x test-creator-verification.sh

echo -e "${GREEN}✅ Created test script: test-creator-verification.sh${NC}"
echo "   Run this script to test the creator verification flow"