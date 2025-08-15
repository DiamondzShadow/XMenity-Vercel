import { InsightIQClient, CommentType, WebhookEvent } from '../index';

// Initialize the InsightIQ client
const client = new InsightIQClient({
  username: 'your-username',
  password: 'your-password',
  sandbox: true // Use sandbox environment for testing
});

// Example: Comments Analytics
async function exampleCommentsAnalytics() {
  console.log('=== Comments Analytics Example ===');
  
  try {
    // 1. Create a comments relevance analysis
    const analysisRequest = await client.commentsAnalytics.createAnalysis({
      work_platform_id: '69dc0dd2-b78e-4013-b0d6-5693bb48b548',
      content_url: 'https://instagram.com/p/example-post',
      brand_profile_url: 'https://instagram.com/yourbrand'
    });
    
    console.log('Analysis job created:', analysisRequest.id);
    
    // 2. Wait for analysis completion
    const insights = await client.commentsAnalytics.waitForCompletion(analysisRequest.id);
    console.log('Analysis completed:', insights.report_information);
    
    // 3. Get relevant comments
    const relevantComments = await client.commentsAnalytics.getComments(analysisRequest.id, {
      type: CommentType.RELEVANT_COMMENTS,
      limit: 50,
      offset: 0
    });
    
    console.log(`Found ${relevantComments.data.length} relevant comments`);
    
    // 4. Get irrelevant comments
    const irrelevantComments = await client.commentsAnalytics.getComments(analysisRequest.id, {
      type: CommentType.IRRELEVANT_COMMENTS,
      limit: 10,
      offset: 0
    });
    
    console.log(`Found ${irrelevantComments.data.length} irrelevant comments`);
    
  } catch (error) {
    console.error('Comments analytics error:', error);
  }
}

// Example: Purchase Intent Analysis
async function examplePurchaseIntent() {
  console.log('=== Purchase Intent Example ===');
  
  try {
    // 1. Create a purchase intent analysis
    const intentRequest = await client.purchaseIntent.createAnalysis({
      work_platform_id: '69dc0dd2-b78e-4013-b0d6-5693bb48b548',
      profile_url: 'https://instagram.com/yourbrand'
    });
    
    console.log('Purchase intent job created:', intentRequest.id);
    
    // 2. Wait for analysis completion (purchase intent takes longer)
    const insights = await client.purchaseIntent.waitForCompletion(intentRequest.id, {
      timeout: 15 * 60 * 1000, // 15 minutes
      interval: 15 * 1000 // 15 seconds
    });
    
    console.log('Purchase intent analysis completed:', insights.report_information);
    console.log('Content analyzed:', insights.content_information.length, 'posts');
    
    // 3. Get all comments with purchase intent
    const allComments = await client.purchaseIntent.getAllComments(intentRequest.id, {
      maxComments: 500
    });
    
    const purchaseIntentComments = allComments.filter(comment => comment.purchase_intent);
    console.log(`Found ${purchaseIntentComments.length} comments with purchase intent`);
    
  } catch (error) {
    console.error('Purchase intent error:', error);
  }
}

// Example: Social Listening
async function exampleSocialListening() {
  console.log('=== Social Listening Example ===');
  
  try {
    // 1. Search by keyword
    const keywordSearch = await client.socialListening.searchByKeyword(
      '69dc0dd2-b78e-4013-b0d6-5693bb48b548', // Instagram platform ID
      'artificial intelligence',
      {
        itemsLimit: 100,
        waitForCompletion: true
      }
    );
    
    console.log('Keyword search completed:', keywordSearch.id);
    
    // 2. Get insights from the search
    const keywordInsights = await client.socialListening.getInsights(keywordSearch.id, {
      limit: 50,
      offset: 0
    });
    
    console.log(`Found ${keywordInsights.data.length} posts about artificial intelligence`);
    
    // 3. Search by hashtag
    const hashtagSearch = await client.socialListening.searchByHashtag(
      '69dc0dd2-b78e-4013-b0d6-5693bb48b548',
      'AI', // without # prefix
      {
        itemsLimit: 50,
        from_date: '2024-01-01',
        to_date: '2024-12-31'
      }
    );
    
    // Wait for completion and get results
    await client.socialListening.waitForCompletion(hashtagSearch.id);
    const hashtagContent = await client.socialListening.getAllContent(hashtagSearch.id, {
      maxContent: 200
    });
    
    console.log(`Found ${hashtagContent.length} posts with #AI hashtag`);
    
    // 4. Search by mention
    const mentionSearch = await client.socialListening.searchByMention(
      '69dc0dd2-b78e-4013-b0d6-5693bb48b548',
      'openai', // without @ prefix
      {
        itemsLimit: 25
      }
    );
    
    console.log('Mention search created:', mentionSearch.id);
    
    // 5. TikTok audio track search example
    const audioSearch = await client.socialListening.searchByAudioTrack(
      'tiktok-platform-id',
      {
        title: 'Bad at Love',
        id: 'UCEyLTzBtHJhlUwkeWhxfMXw'
      },
      {
        itemsLimit: 30,
        waitForCompletion: false
      }
    );
    
    console.log('Audio track search created:', audioSearch.id);
    
  } catch (error) {
    console.error('Social listening error:', error);
  }
}

// Example: Webhook Management
async function exampleWebhooks() {
  console.log('=== Webhooks Example ===');
  
  try {
    // 1. Create a webhook
    const webhook = await client.webhooks.create({
      url: 'https://yourapp.com/webhook/insightiq',
      events: [
        WebhookEvent.PROFILES_ADDED,
        WebhookEvent.CONTENTS_ADDED,
        WebhookEvent.CONTENTS_UPDATED
      ],
      name: 'My InsightIQ Webhook'
    });
    
    console.log('Webhook created:', webhook.id);
    
    // 2. List all webhooks
    const allWebhooks = await client.webhooks.getAll();
    console.log(`Total webhooks: ${allWebhooks.length}`);
    
    // 3. Find active webhooks
    const activeWebhooks = await client.webhooks.findActive();
    console.log(`Active webhooks: ${activeWebhooks.length}`);
    
    // 4. Update webhook (add more events)
    const updatedWebhook = await client.webhooks.update(webhook.id, {
      url: webhook.url,
      events: [
        ...webhook.events,
        WebhookEvent.ACCOUNTS_CONNECTED,
        WebhookEvent.PROFILES_ADDED
      ],
      name: 'Updated InsightIQ Webhook'
    });
    
    console.log('Webhook updated with', updatedWebhook.events.length, 'events');
    
    // 5. Disable webhook temporarily
    await client.webhooks.disable(webhook.id);
    console.log('Webhook disabled');
    
    // 6. Re-enable webhook
    await client.webhooks.enable(webhook.id);
    console.log('Webhook re-enabled');
    
    // 7. Find webhooks by URL pattern
    const myWebhooks = await client.webhooks.findByUrl('yourapp.com');
    console.log(`Found ${myWebhooks.length} webhooks for your app`);
    
  } catch (error) {
    console.error('Webhooks error:', error);
  }
}

// Example: Error Handling
async function exampleErrorHandling() {
  console.log('=== Error Handling Example ===');
  
  try {
    // This will fail with invalid credentials
    const badClient = new InsightIQClient({
      username: 'invalid',
      password: 'invalid',
      sandbox: true
    });
    
    await badClient.commentsAnalytics.createAnalysis({
      work_platform_id: 'invalid-id',
      content_url: 'invalid-url',
      brand_profile_url: 'invalid-url'
    });
    
  } catch (error) {
    if (error instanceof Error) {
      try {
        const apiError = JSON.parse(error.message);
        console.log('API Error Details:');
        console.log('- Status:', apiError.status);
        console.log('- Message:', apiError.message);
        console.log('- Details:', apiError.details);
      } catch {
        console.log('Network or parsing error:', error.message);
      }
    }
  }
}

// Example: Testing Connection
async function exampleTestConnection() {
  console.log('=== Connection Test Example ===');
  
  const isConnected = await client.testConnection();
  if (isConnected) {
    console.log('✅ Successfully connected to InsightIQ API');
    console.log('Base URL:', client.getBaseUrl());
  } else {
    console.log('❌ Failed to connect to InsightIQ API');
  }
}

// Run all examples
async function runAllExamples() {
  await exampleTestConnection();
  await exampleWebhooks();
  await exampleCommentsAnalytics();
  await examplePurchaseIntent();
  await exampleSocialListening();
  await exampleErrorHandling();
}

// Export examples for use in other files
export {
  exampleCommentsAnalytics,
  examplePurchaseIntent,
  exampleSocialListening,
  exampleWebhooks,
  exampleErrorHandling,
  exampleTestConnection,
  runAllExamples
};

// If running this file directly, execute all examples
if (require.main === module) {
  runAllExamples().catch(console.error);
}