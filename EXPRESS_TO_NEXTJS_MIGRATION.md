# Express.js to Next.js API Routes Migration

## Overview

This project has been successfully migrated from Express.js to Next.js API routes to make it compatible with v0.dev (Vercel's AI-powered UI generator). v0.dev only supports Next.js frontend components and API routes, not standalone Express servers.

## Migration Summary

### What Was Migrated

1. **Authentication Routes** (`/api/auth/`)
   - `POST /api/auth/nonce` - Generate wallet nonce
   - `POST /api/auth/verify` - Verify wallet signature

2. **User Routes** (`/api/user/`)
   - `GET /api/user/profile` - Get user profile with tokens and holdings
   - `PUT /api/user/profile` - Update user profile

3. **Token Routes** (`/api/tokens/`)
   - `GET /api/tokens` - List public tokens with pagination and search
   - `POST /api/tokens` - Create new token (authenticated)

4. **Transaction Routes** (`/api/transactions/`)
   - `GET /api/transactions` - Get user's transactions with pagination

5. **Notification Routes** (`/api/notifications/`)
   - `GET /api/notifications` - Get user's notifications
   - `PUT /api/notifications/[id]` - Mark notification as read

6. **Analytics Routes** (`/api/analytics/`)
   - `GET /api/analytics/dashboard` - Get user dashboard analytics

7. **Health Check Route** (`/api/health/`)
   - `GET /api/health` - Service health check

### Key Changes

#### Authentication & Middleware
- **Centralized Auth Utility** (`/lib/auth.ts`): 
  - `authenticateToken()` - Verify JWT tokens
  - `requireAuth()` - Require authentication for routes
  - `rateLimit()` - Simple rate limiting utility

- **Next.js Middleware** (`/middleware.ts`):
  - Global CORS handling
  - Security headers
  - Preflight request handling

#### Database Consistency
- **Unified Prisma Usage**: All routes now use Prisma consistently (previously some used Supabase)
- **Proper Connection Management**: Prisma connections are properly closed in `finally` blocks

#### Error Handling
- **Standardized Responses**: Consistent JSON error responses
- **Proper HTTP Status Codes**: 401 for unauthorized, 400 for validation errors, 500 for server errors

### Removed Dependencies

The following Express-specific dependencies were removed:
- `express`
- `express-rate-limit`
- `helmet`
- `cors`
- `compression`
- `morgan`
- `nodemon`
- `@types/express`
- `@types/cors`
- `@types/compression`
- `@types/morgan`

### Updated Scripts

Removed Express server scripts:
- `server` (was: `node server/index.js`)
- `server:dev` (was: `nodemon server/index.js`)

## Usage

### Development
```bash
npm run dev
```

This starts the Next.js development server which includes both the frontend and API routes.

### Testing API Routes

All endpoints are now available under the `/api` path:

```bash
# Health check
curl http://localhost:3000/api/health

# Get tokens (public)
curl http://localhost:3000/api/tokens

# Get user profile (requires auth header)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/api/user/profile
```

### v0.dev Compatibility

✅ **Now Compatible**: The project now works with v0.dev since all backend logic is in Next.js API routes.

You can now use v0.dev to:
- Generate new frontend components
- Create new pages
- Generate API route handlers
- Build UI that integrates with your existing API

## Considerations

### Rate Limiting
The current rate limiting is in-memory and will reset on server restart. For production, consider using:
- Redis-based rate limiting
- Vercel's built-in rate limiting
- External rate limiting service

### Security
Next.js middleware handles basic security headers. Consider adding:
- CSP (Content Security Policy) configuration
- Additional security headers based on your needs

### Deployment
Since Express server is removed:
- Remove any Express-specific deployment configurations
- Update Docker files if they reference the Express server
- Update any reverse proxy configurations
- The application now runs entirely on Next.js runtime

## File Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── nonce/route.ts
│   │   └── verify/route.ts
│   ├── user/
│   │   └── profile/route.ts
│   ├── tokens/route.ts
│   ├── transactions/route.ts
│   ├── notifications/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── analytics/
│   │   └── dashboard/route.ts
│   └── health/route.ts
├── middleware.ts
└── lib/
    └── auth.ts
```

## Next Steps

1. **Test thoroughly**: Verify all endpoints work as expected
2. **Update frontend**: Update any hardcoded API URLs to use relative paths
3. **Remove server directory**: The `/server` directory can be safely deleted
4. **Update documentation**: Update any API documentation to reflect new endpoints
5. **Use v0.dev**: Start generating components and pages with v0.dev!