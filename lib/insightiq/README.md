# InsightIQ AI SDK

Official TypeScript/JavaScript SDK for the InsightIQ AI API. This SDK provides easy access to InsightIQ's powerful AI-driven social media analytics, including comments analysis, purchase intent detection, social listening, and webhook management.

## Features

- **Comments Analytics** - Analyze comment relevance and sentiment for specific content
- **Purchase Intent Analysis** - Detect purchase intent from user comments and interactions
- **Social Listening** - Search and analyze social media content across platforms (TikTok, Instagram, YouTube, X)
- **Webhook Management** - Set up and manage webhooks for real-time notifications
- **TypeScript Support** - Full type definitions for all API endpoints and responses
- **Error Handling** - Comprehensive error handling with detailed error information
- **Async/Await Support** - Modern promise-based API with polling utilities

## Installation

```bash
npm install @your-org/insightiq-sdk
# or
yarn add @your-org/insightiq-sdk
# or
pnpm add @your-org/insightiq-sdk
```

## Quick Start

```typescript
import { InsightIQClient } from '@your-org/insightiq-sdk';

// Initialize the client
const client = new InsightIQClient({
  username: 'your-username',
  password: 'your-password',
  sandbox: true // Use sandbox for testing
});

// Test connection
const isConnected = await client.testConnection();
console.log('Connected:', isConnected);
```

## API Reference

### Client Configuration

```typescript
interface InsightIQConfig {
  username: string;          // Your InsightIQ username
  password: string;          // Your InsightIQ password
  baseUrl?: string;          // Custom API base URL (optional)
  sandbox?: boolean;         // Use sandbox environment (default: true)
}
```

### Comments Analytics

Analyze comment relevance and sentiment for specific social media content.

```typescript
// Create analysis request
const analysis = await client.commentsAnalytics.createAnalysis({
  work_platform_id: 'platform-uuid',
  content_url: 'https://instagram.com/p/example',
  brand_profile_url: 'https://instagram.com/yourbrand'
});

// Wait for completion
const insights = await client.commentsAnalytics.waitForCompletion(analysis.id);

// Get relevant comments
const comments = await client.commentsAnalytics.getComments(analysis.id, {
  type: CommentType.RELEVANT_COMMENTS,
  limit: 50,
  offset: 0
});
```

**Available Methods:**
- `createAnalysis(data)` - Start comment analysis
- `getInsights(id)` - Get analysis results
- `getComments(id, params)` - Get analyzed comments stream
- `waitForCompletion(id, options)` - Poll until analysis completes

### Purchase Intent Analysis

Detect purchase intent from user comments across a brand's profile.

```typescript
// Create purchase intent analysis
const analysis = await client.purchaseIntent.createAnalysis({
  work_platform_id: 'platform-uuid',
  profile_url: 'https://instagram.com/yourbrand'
});

// Wait for completion (takes longer than comment analysis)
const insights = await client.purchaseIntent.waitForCompletion(analysis.id, {
  timeout: 15 * 60 * 1000, // 15 minutes
  interval: 15 * 1000      // Check every 15 seconds
});

// Get all comments with purchase intent
const intentComments = await client.purchaseIntent.getAllComments(analysis.id);
```

**Available Methods:**
- `createAnalysis(data)` - Start purchase intent analysis
- `getInsights(id)` - Get analysis results
- `getComments(id, params)` - Get analyzed comments with purchase intent flags
- `getAllComments(id, options)` - Get all comments with automatic pagination
- `waitForCompletion(id, options)` - Poll until analysis completes

### Social Listening

Search and analyze social media content across platforms.

```typescript
// Search by keyword
const search = await client.socialListening.searchByKeyword(
  'platform-uuid',
  'artificial intelligence',
  {
    itemsLimit: 100,
    waitForCompletion: true
  }
);

// Search by hashtag
const hashtagSearch = await client.socialListening.searchByHashtag(
  'platform-uuid',
  'AI', // without # prefix
  {
    itemsLimit: 50,
    from_date: '2024-01-01',
    to_date: '2024-12-31'
  }
);

// Get all content with pagination
const allContent = await client.socialListening.getAllContent(search.id, {
  maxContent: 500
});
```

**Available Methods:**
- `createSearch(data)` - Create social listening search
- `getStatus(id)` - Get search status
- `getInsights(id, params)` - Get search results
- `getAllContent(id, options)` - Get all content with pagination
- `searchByKeyword(platformId, keyword, options)` - Convenience method for keyword search
- `searchByHashtag(platformId, hashtag, options)` - Convenience method for hashtag search
- `searchByMention(platformId, mention, options)` - Convenience method for mention search
- `searchByAudioTrack(platformId, track, options)` - TikTok audio track search
- `waitForCompletion(id, options)` - Poll until search completes

### Webhook Management

Set up and manage webhooks for real-time notifications.

```typescript
// Create webhook
const webhook = await client.webhooks.create({
  url: 'https://yourapp.com/webhook/insightiq',
  events: [
    WebhookEvent.PROFILES_ADDED,
    WebhookEvent.CONTENTS_ADDED,
    WebhookEvent.CONTENTS_UPDATED
  ],
  name: 'My InsightIQ Webhook'
});

// List all webhooks
const allWebhooks = await client.webhooks.getAll();

// Find active webhooks
const activeWebhooks = await client.webhooks.findActive();

// Update webhook
const updated = await client.webhooks.update(webhook.id, {
  url: webhook.url,
  events: [...webhook.events, WebhookEvent.ACCOUNTS_CONNECTED],
  name: 'Updated Webhook'
});
```

**Available Methods:**
- `create(data)` - Create new webhook
- `get(id)` - Get webhook by ID
- `update(id, data)` - Update existing webhook
- `delete(id)` - Delete webhook
- `list(params)` - List webhooks with pagination
- `getAll(options)` - Get all webhooks with automatic pagination
- `findByUrl(pattern)` - Find webhooks by URL pattern
- `findByEvent(event)` - Find webhooks by event type
- `findActive()` - Get only active webhooks
- `findInactive()` - Get only inactive webhooks
- `enable(id)` - Enable webhook
- `disable(id)` - Disable webhook
- `enableAll()` - Enable all webhooks
- `disableAll()` - Disable all webhooks

## Advanced Usage

### Error Handling

The SDK provides detailed error information for debugging:

```typescript
try {
  await client.commentsAnalytics.createAnalysis(invalidData);
} catch (error) {
  if (error instanceof Error) {
    try {
      const apiError = JSON.parse(error.message);
      console.log('Status:', apiError.status);
      console.log('Message:', apiError.message);
      console.log('Details:', apiError.details);
    } catch {
      console.log('Network error:', error.message);
    }
  }
}
```

### Polling with Custom Options

All endpoints that support polling accept custom timeout and interval options:

```typescript
// Custom polling configuration
const insights = await client.commentsAnalytics.waitForCompletion(jobId, {
  timeout: 10 * 60 * 1000, // 10 minutes
  interval: 5 * 1000       // Check every 5 seconds
});
```

### Pagination

Many endpoints support automatic pagination:

```typescript
// Get all comments with custom batch size
const allComments = await client.purchaseIntent.getAllComments(jobId, {
  batchSize: 50,      // Fetch 50 at a time
  maxComments: 1000   // Stop at 1000 total
});

// Get all social content with date filters
const content = await client.socialListening.getAllContent(jobId, {
  from_date: '2024-01-01',
  to_date: '2024-12-31',
  maxContent: 500
});
```

## Webhook Events

The SDK supports all webhook events from the InsightIQ API:

```typescript
import { WebhookEvent } from '@your-org/insightiq-sdk';

// Account events
WebhookEvent.ACCOUNTS_CONNECTED
WebhookEvent.ACCOUNTS_DISCONNECTED

// Profile events
WebhookEvent.PROFILES_ADDED
WebhookEvent.PROFILES_UPDATED
WebhookEvent.PROFILES_AUDIENCE_ADDED
WebhookEvent.PROFILES_AUDIENCE_UPDATED

// Content events
WebhookEvent.CONTENTS_ADDED
WebhookEvent.CONTENTS_UPDATED
WebhookEvent.CONTENTS_COMMENTS_ADDED
WebhookEvent.CONTENTS_COMMENTS_UPDATED

// Publishing events
WebhookEvent.CONTENTS_PUBLISH_SUCCESS
WebhookEvent.CONTENTS_PUBLISH_READY
WebhookEvent.CONTENTS_PUBLISH_FAILURE

// And many more...
```

## Platform Support

The SDK supports all platforms available in the InsightIQ API:

- **Instagram** - Posts, Reels, IGTV
- **TikTok** - Videos, Audio tracks
- **YouTube** - Videos, Shorts
- **X (Twitter)** - Tweets, Threads

## Environment Configuration

### Sandbox vs Production

```typescript
// Sandbox (default)
const sandboxClient = new InsightIQClient({
  username: 'test-user',
  password: 'test-pass',
  sandbox: true // or omit (defaults to true)
});

// Production
const prodClient = new InsightIQClient({
  username: 'prod-user',
  password: 'prod-pass',
  sandbox: false
});

// Custom endpoint
const customClient = new InsightIQClient({
  username: 'user',
  password: 'pass',
  baseUrl: 'https://custom-api.insightiq.ai/v1'
});
```

## Rate Limiting

The SDK automatically handles rate limiting by the InsightIQ API. If you encounter rate limit errors, consider:

1. Increasing polling intervals
2. Reducing batch sizes for pagination
3. Implementing exponential backoff in your application

## TypeScript Support

The SDK is written in TypeScript and provides comprehensive type definitions:

```typescript
import { 
  InsightIQClient,
  CommentsAnalyticsRequest,
  CommentsAnalyticsInsights,
  SocialListeningRequest,
  WebhookEvent,
  CommentType,
  Sentiment
} from '@your-org/insightiq-sdk';

// Full type safety
const client = new InsightIQClient(config);
const request: CommentsAnalyticsRequest = {
  work_platform_id: 'uuid',
  content_url: 'https://...',
  brand_profile_url: 'https://...'
};
```

## Examples

See the [examples directory](./examples/) for complete working examples:

- [Basic Usage](./examples/basic-usage.ts) - Getting started with all endpoints
- [Advanced Patterns](./examples/advanced-patterns.ts) - Complex workflows and patterns
- [Webhook Integration](./examples/webhook-integration.ts) - Setting up webhook handlers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- **Documentation**: [InsightIQ API Docs](https://docs.insightiq.ai)
- **Issues**: [GitHub Issues](https://github.com/your-org/insightiq-sdk/issues)
- **Support**: support@insightiq.ai

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and breaking changes.