# InsightIQ AI Connect SDK

A comprehensive TypeScript/JavaScript SDK for the InsightIQ AI Connect API, enabling seamless integration with creator platform data and analytics.

## Features

- **Complete API Coverage**: All InsightIQ Connect endpoints supported
- **TypeScript Support**: Full type safety with comprehensive interfaces
- **Automatic Retries**: Built-in retry logic for network failures
- **Error Handling**: Structured error classes with detailed information
- **Pagination Support**: Automatic pagination handling for large datasets
- **Rate Limiting**: Proper rate limit handling with retry-after support
- **Webhook Integration**: Types and utilities for webhook handling

## Supported Products

- **Identity**: User profile data and audience demographics
- **Engagement**: Content performance, comments, and social metrics
- **Activity**: User listening/viewing history and preferences
- **Content Management**: Social posts, videos, playlists, and content groups

## Installation

```bash
npm install insightiq-sdk
# or
yarn add insightiq-sdk
```

## Quick Start

```typescript
import { InsightIQClient, Products } from 'insightiq-sdk';

// Initialize the client
const client = new InsightIQClient({
  username: 'your-username',
  password: 'your-password',
  baseUrl: 'https://api.sandbox.insightiq.ai/v1', // Optional, defaults to sandbox
});

// Test connection
const isConnected = await client.testConnection();
console.log('Connected:', isConnected);

// Create a user
const user = await client.users.create({
  name: 'John Doe',
  external_id: 'user_12345'
});

// Create SDK token for Connect integration
const sdkToken = await client.tokens.createSDKToken({
  user_id: user.id,
  products: [Products.IDENTITY, Products.ENGAGEMENT, Products.ACTIVITY]
});

// Create connection link
const link = await client.links.create({
  name: 'John Connection',
  external_id: 'connection_12345'
});
```

## Core Services

### Users

```typescript
// Create user
const user = await client.users.create({
  name: 'John Doe',
  external_id: 'user_123'
});

// Get user by ID
const user = await client.users.get('user-uuid');

// Get user by external ID
const user = await client.users.getByExternalId('user_123');

// List users with pagination
const users = await client.users.list({ limit: 50, offset: 0 });

// Get all users (handles pagination automatically)
const allUsers = await client.users.getAll();
```

### Accounts

```typescript
// Get account
const account = await client.accounts.get('account-uuid');

// List accounts with filtering
const accounts = await client.accounts.list({
  user_id: 'user-uuid',
  work_platform_id: 'platform-uuid'
});

// Disconnect account
await client.accounts.disconnect('account-uuid');

// Get accounts by user
const userAccounts = await client.accounts.getByUserId('user-uuid');
```

### Work Platforms

```typescript
// List all platforms
const platforms = await client.workPlatforms.list();

// Get platform by ID
const platform = await client.workPlatforms.get('platform-uuid');

// Find platforms by name
const instagramPlatforms = await client.workPlatforms.findByName('Instagram');
```

### Profiles (Identity)

```typescript
// Get profile
const profile = await client.profiles.get('profile-uuid');

// List profiles with filtering
const profiles = await client.profiles.list({
  account_id: 'account-uuid',
  limit: 10
});

// Refresh profile data
await client.profiles.refresh('account-uuid');

// Get profiles by account
const accountProfiles = await client.profiles.getByAccountId('account-uuid');
```

### Audience Demographics

```typescript
// Get audience demographics
const demographics = await client.audience.getDemographics('account-uuid');

console.log('Countries:', demographics.countries);
console.log('Cities:', demographics.cities);
console.log('Age/Gender distribution:', demographics.gender_age_distribution);
```

### Content (Engagement)

```typescript
// List content items
const contents = await client.contents.list({
  account_id: 'account-uuid',
  from_date: '2023-01-01',
  to_date: '2023-12-31',
  limit: 50
});

// Get specific content
const content = await client.contents.get('content-uuid');

// Get recent content (last 30 days)
const recentContent = await client.contents.getRecent('account-uuid');

// Refresh content data
await client.contents.refresh('account-uuid');

// Fetch historic content
await client.contents.fetchHistoric('account-uuid', '2023-01-01');

// Bulk search
const bulkContents = await client.contents.searchBulk(['uuid1', 'uuid2']);
```

### Content Groups

```typescript
// List content groups (playlists, albums)
const groups = await client.contentGroups.list({
  account_id: 'account-uuid',
  limit: 20
});

// Get specific content group
const group = await client.contentGroups.get('group-uuid');

// Refresh content groups
await client.contentGroups.refresh('account-uuid');
```

### Comments

```typescript
// List comments for content
const comments = await client.comments.list({
  account_id: 'account-uuid',
  content_id: 'content-uuid',
  limit: 100
});

// Get all comments for content
const allComments = await client.comments.getAllForContent(
  'account-uuid',
  'content-uuid'
);

// Get recent comments
const recentComments = await client.comments.getRecent(
  'account-uuid',
  'content-uuid'
);
```

### Activity Artists

```typescript
// Get activity artists
const artists = await client.activityArtists.list({
  account_id: 'account-uuid'
});

// Get specific artist
const artist = await client.activityArtists.get('artist-uuid');

// Get followed artists
const followedArtists = await client.activityArtists.getFollowedArtists('account-uuid');

// Get top artists
const topArtists = await client.activityArtists.getTopArtists('account-uuid');

// Get artists by genre
const rockArtists = await client.activityArtists.getByGenre('account-uuid', 'rock');
```

### Activity Contents

```typescript
// Get activity contents
const contents = await client.activityContents.list({
  account_id: 'account-uuid'
});

// Get by activity type
const topContents = await client.activityContents.getTopContents('account-uuid');
const recentContents = await client.activityContents.getRecentContents('account-uuid');
const savedContents = await client.activityContents.getSavedContents('account-uuid');

// Get by genre/artist/album
const jazzContents = await client.activityContents.getByGenre('account-uuid', 'jazz');
const artistContents = await client.activityContents.getByArtist('account-uuid', 'Beatles');
const albumContents = await client.activityContents.getByAlbum('account-uuid', 'Abbey Road');
```

## Configuration Options

```typescript
const client = new InsightIQClient({
  username: 'your-username',
  password: 'your-password',
  baseUrl: 'https://api.sandbox.insightiq.ai/v1', // Optional
  timeout: 30000, // Optional, default 30s
  retryAttempts: 3, // Optional, default 3
  retryDelay: 1000, // Optional, default 1s
});
```

## Error Handling

The SDK provides structured error classes:

```typescript
import { 
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  NetworkError 
} from 'insightiq-sdk';

try {
  const user = await client.users.get('invalid-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('User not found');
  } else if (error instanceof AuthenticationError) {
    console.log('Authentication failed');
  } else if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter);
  }
}
```

## Pagination

Most list methods support pagination:

```typescript
// Manual pagination
const firstPage = await client.users.list({ limit: 50, offset: 0 });
const secondPage = await client.users.list({ limit: 50, offset: 50 });

// Automatic pagination (convenience method)
const allUsers = await client.users.getAll();
```

## Date Ranges

Use ISO 8601 date format (YYYY-MM-DD) for date parameters:

```typescript
const contents = await client.contents.list({
  account_id: 'account-uuid',
  from_date: '2023-01-01',
  to_date: '2023-12-31'
});
```

## Webhook Integration

The SDK includes types for webhook payloads:

```typescript
import type { 
  Profile,
  Content,
  ActivityArtist,
  ActivityContent 
} from 'insightiq-sdk';

// Use these types when handling webhook data
function handleProfileUpdate(profile: Profile) {
  console.log('Profile updated:', profile.id);
}
```

## Production Usage

For production, use the live API:

```typescript
const client = new InsightIQClient({
  username: 'your-username',
  password: 'your-password',
  baseUrl: 'https://api.insightiq.ai/v1', // Production endpoint
});
```

## Examples

See the `/examples` directory for comprehensive usage examples:

- `basic-usage.ts` - Basic SDK operations
- `analytics-dashboard.ts` - Building analytics dashboards
- `webhook-handler.ts` - Processing webhook events

## TypeScript Support

The SDK is written in TypeScript and provides complete type definitions:

```typescript
import type { 
  User,
  Account,
  Profile,
  Content,
  AudienceDemographics,
  ActivityArtist,
  ActivityContent
} from 'insightiq-sdk';
```

## Rate Limiting

The SDK automatically handles rate limits:

- Detects 429 responses
- Implements exponential backoff
- Respects `Retry-After` headers
- Configurable retry attempts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For API documentation and support:
- [InsightIQ API Documentation](https://docs.insightiq.ai)
- [Developer Portal](https://developers.insightiq.ai)
- Email: support@insightiq.ai

---

Built with ❤️ for the creator economy
