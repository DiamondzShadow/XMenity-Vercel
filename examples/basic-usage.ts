import { InsightIQClient, Products } from '../lib/insightiq';

// Initialize the client
const client = new InsightIQClient({
  username: 'your-username',
  password: 'your-password',
  baseUrl: 'https://api.sandbox.insightiq.ai/v1', // Optional, defaults to sandbox
});

async function basicUsageExamples() {
  try {
    // Test connection
    const isConnected = await client.testConnection();
    console.log('Connected to InsightIQ:', isConnected);

    // Create a user
    const newUser = await client.users.create({
      name: 'John Doe',
      external_id: 'user_12345'
    });
    console.log('Created user:', newUser);

    // Get user by external ID
    const user = await client.users.getByExternalId('user_12345');
    console.log('Retrieved user:', user);

    // Create SDK token for Connect integration
    const sdkToken = await client.tokens.createSDKToken({
      user_id: user.id,
      products: [
        Products.IDENTITY,
        Products.ENGAGEMENT,
        Products.ACTIVITY
      ]
    });
    console.log('SDK Token:', sdkToken);

    // Create a connection link
    const connectionLink = await client.links.create({
      name: 'John Doe Connection',
      external_id: 'connection_12345'
    });
    console.log('Connection link:', connectionLink);

    // List work platforms
    const platforms = await client.workPlatforms.list({ limit: 10 });
    console.log('Available platforms:', platforms.data);

    // Find Instagram platform
    const instagramPlatforms = await client.workPlatforms.findByName('Instagram');
    console.log('Instagram platform:', instagramPlatforms[0]);

    // List user accounts
    const accounts = await client.accounts.getByUserId(user.id);
    console.log('User accounts:', accounts);

    if (accounts.length > 0) {
      const account = accounts[0];

      // Get profile information
      const profiles = await client.profiles.getByAccountId(account.id);
      console.log('Account profiles:', profiles);

      // Get audience demographics
      const audience = await client.audience.getDemographics(account.id);
      console.log('Audience demographics:', audience);

      // Get content items
      const contents = await client.contents.list({ 
        account_id: account.id,
        limit: 10 
      });
      console.log('Content items:', contents.data);

      // Get recent content (last 30 days)
      const recentContent = await client.contents.getRecent(account.id);
      console.log('Recent content count:', recentContent.length);

      // Get content groups (playlists, albums)
      const contentGroups = await client.contentGroups.list({
        account_id: account.id,
        limit: 10
      });
      console.log('Content groups:', contentGroups.data);

      // Get comments for content
      if (contents.data.length > 0) {
        const comments = await client.comments.list({
          account_id: account.id,
          content_id: contents.data[0].id,
          limit: 10
        });
        console.log('Comments:', comments.data);
      }

      // Get activity data
      const activityArtists = await client.activityArtists.getAllForAccount(account.id);
      console.log('Activity artists count:', activityArtists.length);

      const topArtists = await client.activityArtists.getTopArtists(account.id);
      console.log('Top artists:', topArtists);

      const activityContents = await client.activityContents.getAllForAccount(account.id);
      console.log('Activity contents count:', activityContents.length);

      const savedContents = await client.activityContents.getSavedContents(account.id);
      console.log('Saved contents:', savedContents);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

async function advancedUsageExamples() {
  try {
    // Bulk operations
    const users = await client.users.getAll();
    console.log('All users count:', users.length);

    // Find users with specific accounts
    const usersWithAccounts = await Promise.all(
      users.slice(0, 5).map(async (user) => {
        const accounts = await client.accounts.getByUserId(user.id);
        return { user, accountCount: accounts.length };
      })
    );
    console.log('Users with account counts:', usersWithAccounts);

    // Get content analytics
    const account = await client.accounts.list({ limit: 1 });
    if (account.data.length > 0) {
      const accountId = account.data[0].id;
      
      // Get content by date range
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      
      const recentContents = await client.contents.getByDateRange(
        accountId, 
        fromDate, 
        toDate
      );
      
      // Analyze engagement
      const totalLikes = recentContents.reduce((sum, content) => 
        sum + content.engagement.like_count, 0
      );
      const totalViews = recentContents.reduce((sum, content) => 
        sum + content.engagement.view_count, 0
      );
      
      console.log('Analytics for last 30 days:', {
        contentCount: recentContents.length,
        totalLikes,
        totalViews,
        averageLikesPerContent: totalLikes / recentContents.length || 0
      });

      // Refresh data
      await client.contents.refresh(accountId);
      await client.profiles.refresh(accountId);
      console.log('Data refresh initiated');
    }

  } catch (error) {
    console.error('Advanced usage error:', error);
  }
}

async function errorHandlingExample() {
  try {
    // This will throw an error
    await client.users.get('invalid-user-id');
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      console.log('User not found:', error.message);
    } else if (error.name === 'AuthenticationError') {
      console.log('Authentication failed:', error.message);
    } else if (error.name === 'RateLimitError') {
      console.log('Rate limit exceeded, retry after:', error.retryAfter);
    } else {
      console.log('General error:', error.message);
    }
  }
}

// Run examples
basicUsageExamples();
advancedUsageExamples();
errorHandlingExample();