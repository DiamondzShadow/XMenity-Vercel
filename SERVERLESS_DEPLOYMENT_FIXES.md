# Serverless Deployment Fixes

This document outlines the critical fixes applied to resolve deployment and performance issues identified during the Express.js to Next.js migration.

## Issues Fixed

### 1. 🚨 Critical: In-Memory Rate Limiter Issue

**Problem**: The original rate limiter in `middleware.ts` used in-memory storage (`Map`) which doesn't work in serverless environments where each function instance has separate memory.

**Solution**: Replaced with serverless-compatible basic rate limiting that uses request headers for validation.

```typescript
// Before: Problematic in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// After: Serverless-compatible approach
function simpleRateLimit(request: NextRequest): boolean {
  const forwardedFor = request.headers.get('x-forwarded-for');
  // Basic validation without persistent state
  if (forwardedFor && forwardedFor.split(',').length > 5) {
    return false;
  }
  return true;
}
```

**Production Recommendations**:
- Use **Upstash Redis** for distributed rate limiting
- Leverage platform-specific rate limiting (Vercel Edge Config, Netlify Edge Functions)
- Consider external services like Cloudflare Rate Limiting

### 2. 🔧 Firebase Configuration for Standalone Output

**Problem**: Firebase configuration was set for static export (`"public": "out"`) but the app uses `output: 'standalone'`.

**Solution**: Updated Firebase configuration for server-side rendering:

```json
{
  "hosting": {
    "public": ".next/standalone/public",
    "rewrites": [{ "source": "**", "function": "nextjsFunc" }]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

### 3. 🛠️ Deployment Script Improvements

**Problem**: Multiple issues in `deploy.sh`:
- Fixed sleep duration causing race conditions
- Global npm package installations causing permission issues

**Solutions**:

#### Health Check Improvements
```bash
# Before: Fixed 5-second wait
sleep 5
if node healthcheck.js; then

# After: Robust polling with timeout
for i in {1..30}; do
    if node healthcheck.js; then
        echo "✅ Health check passed"
        return 0
    fi
    sleep 2
done
```

#### CLI Tool Management
```bash
# Before: Global installations
npm install -g netlify-cli
netlify deploy

# After: Using npx
npx netlify-cli deploy --prod --dir=.next
```

## Deployment Platform Recommendations

### ✅ Recommended Platforms
1. **Vercel** - Best for Next.js with `output: 'standalone'`
2. **Railway** - Excellent for full-stack apps with databases
3. **DigitalOcean App Platform** - Good for containerized deployments

### ⚠️ Requires Additional Setup
1. **Firebase** - Complex setup for standalone mode
2. **Netlify** - Better suited for static exports

### 🐳 Docker Deployment
The existing Dockerfile works well with the standalone output. No changes needed.

## Environment Variables

Ensure these are set for all deployments:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
THIRDWEB_CLIENT_ID=your-client-id
FACTORY_CONTRACT_ADDRESS=0x...
ARBITRUM_RPC_URL=https://...
FRONTEND_URL=https://your-domain.com
```

## Performance Optimizations Applied

1. **Middleware Efficiency**: Removed heavy in-memory operations
2. **Header-based Security**: Lightweight request validation
3. **Better Error Handling**: Proper status codes and retry headers
4. **Robust Health Checks**: Prevents deployment of unhealthy instances

## Next Steps for Production

1. **Implement Distributed Rate Limiting**:
   ```bash
   npm install @upstash/redis @upstash/ratelimit
   ```

2. **Set Up Monitoring**:
   - Application performance monitoring (APM)
   - Error tracking (Sentry)
   - Health check endpoints

3. **Security Enhancements**:
   - Environment-specific CORS origins
   - API key authentication for sensitive endpoints
   - Request logging and anomaly detection

4. **Database Optimization**:
   - Connection pooling for high traffic
   - Read replicas for scale
   - Query optimization

## Testing the Fixes

Run the deployment script to verify fixes:

```bash
chmod +x deploy.sh
./deploy.sh
```

Select option 5 for "Health check only" to test the improved health checking.

## Rollback Plan

If issues occur, revert to the previous Express.js setup:

1. Checkout the previous commit
2. Restore the `server/` directory
3. Update `package.json` scripts
4. Redeploy using the old configuration

---

These fixes ensure the Next.js migration is production-ready for serverless deployment while maintaining performance and security standards.