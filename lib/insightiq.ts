import axios from 'axios';

// InsightIQ API Configuration
const INSIGHTIQ_API_BASE = process.env.NEXT_PUBLIC_INSIGHTIQ_API_URL || 'https://api.insightiq.ai';
const INSIGHTIQ_CLIENT_ID = process.env.NEXT_PUBLIC_INSIGHTIQ_CLIENT_ID;
const INSIGHTIQ_CLIENT_SECRET = process.env.INSIGHTIQ_CLIENT_SECRET;

// Types for InsightIQ data
export interface InsightIQProfile {
  id: string;
  username: string;
  handle: string;
  platform: 'twitter' | 'instagram' | 'tiktok' | 'youtube';
  displayName: string;
  bio: string;
  profileImageUrl: string;
  followers: number;
  following: number;
  posts: number;
  verified: boolean;
  engagementRate: number;
  influenceScore: number;
  averageLikes: number;
  averageComments: number;
  lastActivityAt: string;
  isActive: boolean;
}

export interface InsightIQEngagementData {
  userId: string;
  platform: string;
  period: string; // 'daily', 'weekly', 'monthly'
  metrics: {
    followers: number;
    posts: number;
    likes: number;
    comments: number;
    shares: number;
    views: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  };
  growth: {
    followersGrowth: number;
    engagementGrowth: number;
    postsGrowth: number;
  };
  timestamp: string;
}

export interface InsightIQOAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
  scope: string[];
}

export interface InsightIQFollowerAnalytics {
  topFollowers: Array<{
    userId: string;
    username: string;
    engagementScore: number;
    walletAddress?: string; // If linked to our platform
  }>;
  engagementDistribution: {
    highEngagement: number;
    mediumEngagement: number;
    lowEngagement: number;
  };
  followerGrowth: Array<{
    date: string;
    count: number;
    growth: number;
  }>;
}

class InsightIQService {
  private apiClient: any;
  private accessToken: string | null = null;

  constructor() {
    this.apiClient = axios.create({
      baseURL: INSIGHTIQ_API_BASE,
      timeout: 30000,
    });

    // Request interceptor to add auth headers
    this.apiClient.interceptors.request.use((config: any) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          await this.refreshAccessToken();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initiate OAuth flow with InsightIQ
   */
  getOAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: INSIGHTIQ_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read:profile read:analytics read:followers',
      ...(state && { state }),
    });

    return `${INSIGHTIQ_API_BASE}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<InsightIQOAuthToken> {
    try {
      const response = await this.apiClient.post('/oauth/token', {
        grant_type: 'authorization_code',
        client_id: INSIGHTIQ_CLIENT_ID,
        client_secret: INSIGHTIQ_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      });

      const tokenData = response.data;
      this.accessToken = tokenData.access_token;

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        tokenType: tokenData.token_type,
        scope: tokenData.scope?.split(' ') || [],
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to authenticate with InsightIQ');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken?: string): Promise<InsightIQOAuthToken> {
    try {
      const response = await this.apiClient.post('/oauth/token', {
        grant_type: 'refresh_token',
        client_id: INSIGHTIQ_CLIENT_ID,
        client_secret: INSIGHTIQ_CLIENT_SECRET,
        refresh_token: refreshToken,
      });

      const tokenData = response.data;
      this.accessToken = tokenData.access_token;

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        tokenType: tokenData.token_type,
        scope: tokenData.scope?.split(' ') || [],
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh InsightIQ token');
    }
  }

  /**
   * Set access token for API calls
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get creator profile from InsightIQ
   */
  async getCreatorProfile(userId?: string): Promise<InsightIQProfile> {
    try {
      const endpoint = userId ? `/users/${userId}` : '/me';
      const response = await this.apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching creator profile:', error);
      throw new Error('Failed to fetch creator profile from InsightIQ');
    }
  }

  /**
   * Get engagement analytics for a creator
   */
  async getEngagementData(userId: string, period: string = 'monthly'): Promise<InsightIQEngagementData> {
    try {
      const response = await this.apiClient.get(`/users/${userId}/analytics`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      throw new Error('Failed to fetch engagement data from InsightIQ');
    }
  }

  /**
   * Get follower analytics and top engaged followers
   */
  async getFollowerAnalytics(userId: string): Promise<InsightIQFollowerAnalytics> {
    try {
      const response = await this.apiClient.get(`/users/${userId}/followers/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching follower analytics:', error);
      throw new Error('Failed to fetch follower analytics from InsightIQ');
    }
  }

  /**
   * Verify creator's social media account
   */
  async verifyCreator(userId: string): Promise<{ verified: boolean; profile: InsightIQProfile }> {
    try {
      const response = await this.apiClient.post(`/users/${userId}/verify`);
      return response.data;
    } catch (error) {
      console.error('Error verifying creator:', error);
      throw new Error('Failed to verify creator with InsightIQ');
    }
  }

  /**
   * Search for creators by handle or name
   */
  async searchCreators(query: string, platform?: string): Promise<InsightIQProfile[]> {
    try {
      const response = await this.apiClient.get('/search/creators', {
        params: { q: query, platform }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error searching creators:', error);
      throw new Error('Failed to search creators in InsightIQ');
    }
  }

  /**
   * Get historical metrics for milestone tracking
   */
  async getHistoricalMetrics(userId: string, startDate: string, endDate: string): Promise<any> {
    try {
      const response = await this.apiClient.get(`/users/${userId}/metrics/historical`, {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching historical metrics:', error);
      throw new Error('Failed to fetch historical metrics from InsightIQ');
    }
  }

  /**
   * Subscribe to real-time updates for a creator
   */
  async subscribeToUpdates(userId: string, webhookUrl: string): Promise<{ subscriptionId: string }> {
    try {
      const response = await this.apiClient.post(`/users/${userId}/subscribe`, {
        webhook_url: webhookUrl,
        events: ['follower_count_change', 'new_post', 'engagement_milestone']
      });
      return response.data;
    } catch (error) {
      console.error('Error subscribing to updates:', error);
      throw new Error('Failed to subscribe to InsightIQ updates');
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribeFromUpdates(subscriptionId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/subscriptions/${subscriptionId}`);
    } catch (error) {
      console.error('Error unsubscribing from updates:', error);
      throw new Error('Failed to unsubscribe from InsightIQ updates');
    }
  }

  /**
   * Get platform-specific engagement rates and benchmarks
   */
  async getEngagementBenchmarks(platform: string, followerRange: string): Promise<any> {
    try {
      const response = await this.apiClient.get('/benchmarks/engagement', {
        params: { platform, follower_range: followerRange }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching engagement benchmarks:', error);
      throw new Error('Failed to fetch engagement benchmarks from InsightIQ');
    }
  }
}

// Export singleton instance
export const insightIQService = new InsightIQService();

// Helper functions for common operations
export const InsightIQHelpers = {
  /**
   * Format follower count for display
   */
  formatFollowerCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  },

  /**
   * Calculate engagement rate
   */
  calculateEngagementRate(likes: number, comments: number, followers: number): number {
    if (followers === 0) return 0;
    return ((likes + comments) / followers) * 100;
  },

  /**
   * Determine creator tier based on followers
   */
  getCreatorTier(followers: number): 'nano' | 'micro' | 'macro' | 'mega' {
    if (followers < 1000) return 'nano';
    if (followers < 100000) return 'micro';
    if (followers < 1000000) return 'macro';
    return 'mega';
  },

  /**
   * Generate token symbol from handle
   */
  generateTokenSymbol(handle: string): string {
    // Remove @ symbol and convert to uppercase
    const clean = handle.replace('@', '').toUpperCase();
    // Take first 6 characters or pad if shorter
    return clean.substring(0, 6).padEnd(3, 'X');
  },

  /**
   * Calculate milestone thresholds based on current followers
   */
  generateMilestoneThresholds(currentFollowers: number): number[] {
    const thresholds = [];
    let nextMilestone = Math.ceil(currentFollowers / 1000) * 1000; // Round up to next thousand
    
    // Generate 5 milestone thresholds
    for (let i = 0; i < 5; i++) {
      if (nextMilestone > currentFollowers) {
        thresholds.push(nextMilestone);
      }
      nextMilestone += nextMilestone < 10000 ? 1000 : nextMilestone < 100000 ? 5000 : 10000;
    }
    
    return thresholds;
  },

  /**
   * Calculate recommended tokens per follower based on tier
   */
  getRecommendedTokensPerFollower(followers: number): number {
    const tier = this.getCreatorTier(followers);
    switch (tier) {
      case 'nano': return 10; // 10 tokens per follower
      case 'micro': return 5;
      case 'macro': return 1;
      case 'mega': return 0.1;
      default: return 1;
    }
  },

  /**
   * Validate social media handle format
   */
  validateHandle(handle: string, platform: string): boolean {
    const cleanHandle = handle.replace('@', '');
    
    switch (platform) {
      case 'twitter':
        return /^[a-zA-Z0-9_]{1,15}$/.test(cleanHandle);
      case 'instagram':
        return /^[a-zA-Z0-9_.]{1,30}$/.test(cleanHandle);
      case 'tiktok':
        return /^[a-zA-Z0-9_.]{1,24}$/.test(cleanHandle);
      default:
        return cleanHandle.length > 0;
    }
  }
};

export default insightIQService;