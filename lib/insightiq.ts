import { FirebaseUtils } from './firebase';

export interface InsightIQUser {
  id: string;
  username: string;
  platform: string;
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  averageLikes: number;
  averageComments: number;
  influenceScore: number;
  verified: boolean;
  profileImage?: string;
  bio?: string;
  isActive: boolean;
  lastUpdated: Date;
}

export interface InsightIQMetrics {
  reach: number;
  impressions: number;
  engagement: number;
  clicks: number;
  shares: number;
  saves: number;
  comments: number;
  likes: number;
  period: string; // "24h", "7d", "30d"
}

class InsightIQService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.INSIGHTIQ_API_KEY || '';
    this.apiUrl = process.env.INSIGHTIQ_API_URL || 'https://api.insightiq.ai';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`InsightIQ API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getUserByUsername(username: string, platform: string = 'twitter'): Promise<InsightIQUser | null> {
    try {
      const data = await this.makeRequest(`/v1/users/lookup?username=${username}&platform=${platform}`);
      
      if (!data.user) {
        return null;
      }

      return {
        id: data.user.id,
        username: data.user.username,
        platform: data.user.platform,
        followers: data.user.followers || 0,
        following: data.user.following || 0,
        posts: data.user.posts || 0,
        engagementRate: data.user.engagement_rate || 0,
        averageLikes: data.user.average_likes || 0,
        averageComments: data.user.average_comments || 0,
        influenceScore: data.user.influence_score || 0,
        verified: data.user.verified || false,
        profileImage: data.user.profile_image,
        bio: data.user.bio,
        isActive: data.user.is_active || true,
        lastUpdated: new Date(data.user.last_updated || Date.now()),
      };
    } catch (error) {
      console.error('Error fetching user from InsightIQ:', error);
      return null;
    }
  }

  async getUserMetrics(userId: string, period: string = '30d'): Promise<InsightIQMetrics | null> {
    try {
      const data = await this.makeRequest(`/v1/users/${userId}/metrics?period=${period}`);
      
      if (!data.metrics) {
        return null;
      }

      return {
        reach: data.metrics.reach || 0,
        impressions: data.metrics.impressions || 0,
        engagement: data.metrics.engagement || 0,
        clicks: data.metrics.clicks || 0,
        shares: data.metrics.shares || 0,
        saves: data.metrics.saves || 0,
        comments: data.metrics.comments || 0,
        likes: data.metrics.likes || 0,
        period,
      };
    } catch (error) {
      console.error('Error fetching metrics from InsightIQ:', error);
      return null;
    }
  }

  async verifyInfluencer(username: string, platform: string = 'twitter'): Promise<{ verified: boolean; score: number; tier: string }> {
    try {
      const user = await this.getUserByUsername(username, platform);
      
      if (!user) {
        return { verified: false, score: 0, tier: 'none' };
      }

      // Verification criteria
      const minFollowers = 1000;
      const minEngagementRate = 0.01; // 1%
      const minInfluenceScore = 50;

      const verified = 
        user.followers >= minFollowers &&
        user.engagementRate >= minEngagementRate &&
        user.influenceScore >= minInfluenceScore;

      // Determine tier based on metrics
      let tier = 'none';
      if (verified) {
        if (user.followers >= 100000 && user.influenceScore >= 80) {
          tier = 'mega';
        } else if (user.followers >= 10000 && user.influenceScore >= 70) {
          tier = 'macro';
        } else if (user.followers >= 1000 && user.influenceScore >= 60) {
          tier = 'micro';
        } else {
          tier = 'nano';
        }
      }

      return {
        verified,
        score: user.influenceScore,
        tier,
      };
    } catch (error) {
      console.error('Error verifying influencer:', error);
      return { verified: false, score: 0, tier: 'none' };
    }
  }

  async trackTokenMinting(tokenData: any, userMetrics: InsightIQUser) {
    try {
      // Calculate minting amount based on influence metrics
      const baseAmount = 1000;
      const followerMultiplier = Math.min(userMetrics.followers / 1000, 100); // Max 100x
      const engagementBonus = userMetrics.engagementRate * 1000; // Engagement rate bonus
      const influenceBonus = userMetrics.influenceScore * 10; // Influence score bonus

      const mintAmount = Math.floor(
        baseAmount + (baseAmount * followerMultiplier * 0.1) + engagementBonus + influenceBonus
      );

      // Log the minting decision
      await this.makeRequest('/v1/events/token-mint', {
        method: 'POST',
        body: JSON.stringify({
          token_id: tokenData.id,
          user_id: userMetrics.id,
          mint_amount: mintAmount,
          follower_count: userMetrics.followers,
          engagement_rate: userMetrics.engagementRate,
          influence_score: userMetrics.influenceScore,
          timestamp: new Date().toISOString(),
        }),
      });

      // Track in Firebase for backup
      await FirebaseUtils.trackEvent('token_minted', {
        tokenId: tokenData.id,
        userId: userMetrics.id,
        mintAmount,
        metrics: userMetrics,
      });

      return {
        success: true,
        mintAmount,
        reason: 'influence_based_minting',
      };
    } catch (error) {
      console.error('Error tracking token minting:', error);
      return {
        success: false,
        mintAmount: 0,
        reason: 'tracking_error',
      };
    }
  }

  async getInfluencerLeaderboard(limit: number = 50): Promise<InsightIQUser[]> {
    try {
      const data = await this.makeRequest(`/v1/leaderboard?limit=${limit}&sort=influence_score`);
      
      return data.users?.map((user: any) => ({
        id: user.id,
        username: user.username,
        platform: user.platform,
        followers: user.followers || 0,
        following: user.following || 0,
        posts: user.posts || 0,
        engagementRate: user.engagement_rate || 0,
        averageLikes: user.average_likes || 0,
        averageComments: user.average_comments || 0,
        influenceScore: user.influence_score || 0,
        verified: user.verified || false,
        profileImage: user.profile_image,
        bio: user.bio,
        isActive: user.is_active || true,
        lastUpdated: new Date(user.last_updated || Date.now()),
      })) || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  async searchInfluencers(query: string, filters: any = {}): Promise<InsightIQUser[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters,
      });

      const data = await this.makeRequest(`/v1/search/users?${params}`);
      
      return data.users?.map((user: any) => ({
        id: user.id,
        username: user.username,
        platform: user.platform,
        followers: user.followers || 0,
        following: user.following || 0,
        posts: user.posts || 0,
        engagementRate: user.engagement_rate || 0,
        averageLikes: user.average_likes || 0,
        averageComments: user.average_comments || 0,
        influenceScore: user.influence_score || 0,
        verified: user.verified || false,
        profileImage: user.profile_image,
        bio: user.bio,
        isActive: user.is_active || true,
        lastUpdated: new Date(user.last_updated || Date.now()),
      })) || [];
    } catch (error) {
      console.error('Error searching influencers:', error);
      return [];
    }
  }

  // Mock data for development/testing
  async getMockData(username: string): Promise<InsightIQUser> {
    return {
      id: `mock_${username}`,
      username,
      platform: 'twitter',
      followers: Math.floor(Math.random() * 100000) + 1000,
      following: Math.floor(Math.random() * 5000) + 100,
      posts: Math.floor(Math.random() * 10000) + 100,
      engagementRate: Math.random() * 0.1 + 0.01, // 1-11%
      averageLikes: Math.floor(Math.random() * 1000) + 10,
      averageComments: Math.floor(Math.random() * 100) + 1,
      influenceScore: Math.floor(Math.random() * 100) + 1,
      verified: Math.random() > 0.7, // 30% chance of being verified
      profileImage: `https://avatars.githubusercontent.com/${username}`,
      bio: `Mock bio for ${username}`,
      isActive: true,
      lastUpdated: new Date(),
    };
  }
}

export const insightIQ = new InsightIQService();

// Helper functions
export const calculateTokenMintAmount = (metrics: InsightIQUser): number => {
  const baseAmount = 1000;
  const followerMultiplier = Math.min(metrics.followers / 1000, 100);
  const engagementBonus = metrics.engagementRate * 1000;
  const influenceBonus = metrics.influenceScore * 10;

  return Math.floor(
    baseAmount + (baseAmount * followerMultiplier * 0.1) + engagementBonus + influenceBonus
  );
};

export const getInfluenceTier = (metrics: InsightIQUser): string => {
  if (metrics.followers >= 100000 && metrics.influenceScore >= 80) {
    return 'mega';
  } else if (metrics.followers >= 10000 && metrics.influenceScore >= 70) {
    return 'macro';
  } else if (metrics.followers >= 1000 && metrics.influenceScore >= 60) {
    return 'micro';
  } else if (metrics.followers >= 100 && metrics.influenceScore >= 40) {
    return 'nano';
  }
  return 'none';
};

export const isEligibleForTokenCreation = (metrics: InsightIQUser): boolean => {
  return (
    metrics.followers >= 1000 &&
    metrics.engagementRate >= 0.01 &&
    metrics.influenceScore >= 50
  );
};
