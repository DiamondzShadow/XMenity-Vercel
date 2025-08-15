import jwt from 'jsonwebtoken'

interface InsightIQProfile {
  id: string
  username: string
  displayName: string
  profileImage: string
  verified: boolean
  followers: number
  following: number
  tweets: number
  engagement: {
    likes: number
    retweets: number
    replies: number
    avgEngagementRate: number
  }
  metrics: {
    reach: number
    impressions: number
    influence: number
    authenticity: number
    growth_rate: number
  }
  verificationLevel: 'unverified' | 'basic' | 'premium' | 'elite'
  lastVerified: string
  historicalMetrics?: {
    followers_30d: number[]
    engagement_30d: number[]
    growth_rate_30d: number
  }
}

interface InsightIQMetrics {
  followers: number
  engagement_rate: number
  reach: number
  influence_score: number
  authenticity_score: number
  growth_rate: number
  lastUpdated: string
}

interface CreatorVerificationData {
  username: string
  wallet_address: string
  verification_level: string
  verified_at: string
  metrics: InsightIQMetrics
  milestones: {
    current_followers: number
    follower_milestones: number[]
    engagement_milestones: number[]
  }
}

interface JWTPayload {
  creator_wallet: string
  username: string
  verification_level: string
  metrics: InsightIQMetrics
  iat: number
  exp: number
}

class InsightIQClient {
  private baseUrl: string
  private apiKey: string
  private jwtSecret: string

  constructor() {
    this.baseUrl = process.env.INSIGHTIQ_BASE_URL || "https://api.staging.insightiq.ai/v1"
    this.apiKey = process.env.INSIGHTIQ_API_KEY || ""
    this.jwtSecret = process.env.JWT_SECRET || "fallback_secret_key_for_development_only"
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`InsightIQ API Error: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('InsightIQ API request failed:', error)
      throw error
    }
  }

  async getProfile(username: string): Promise<InsightIQProfile> {
    try {
      const data = await this.makeRequest(`/creators/${username}/profile`)
      
      return {
        id: data.id || `mock_${username}`,
        username: data.username || username,
        displayName: data.display_name || username,
        profileImage: data.profile_image || `/placeholder.svg?height=100&width=100`,
        verified: data.verified || false,
        followers: data.followers || 0,
        following: data.following || 0,
        tweets: data.tweets || 0,
        engagement: {
          likes: data.engagement?.likes || 0,
          retweets: data.engagement?.retweets || 0,
          replies: data.engagement?.replies || 0,
          avgEngagementRate: data.engagement?.avg_engagement_rate || 0,
        },
        metrics: {
          reach: data.metrics?.reach || 0,
          impressions: data.metrics?.impressions || 0,
          influence: data.metrics?.influence_score || 0,
          authenticity: data.metrics?.authenticity_score || 0,
          growth_rate: data.metrics?.growth_rate || 0,
        },
        verificationLevel: data.verification_level || 'unverified',
        lastVerified: data.last_verified || new Date().toISOString(),
        historicalMetrics: data.historical_metrics,
      }
    } catch (error) {
      console.error("Error fetching profile:", error)

      // Return mock data for development/testing
      return this.generateMockProfile(username)
    }
  }

  private generateMockProfile(username: string): InsightIQProfile {
    const followers = Math.floor(Math.random() * 100000) + 1000
    const engagementRate = Math.random() * 10 + 1
    
    return {
      id: `mock_${username}`,
      username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      profileImage: `/placeholder.svg?height=100&width=100`,
      verified: Math.random() > 0.3,
      followers,
      following: Math.floor(Math.random() * 5000) + 100,
      tweets: Math.floor(Math.random() * 10000) + 500,
      engagement: {
        likes: Math.floor(Math.random() * 50000),
        retweets: Math.floor(Math.random() * 10000),
        replies: Math.floor(Math.random() * 5000),
        avgEngagementRate: engagementRate,
      },
      metrics: {
        reach: followers * (2 + Math.random() * 3),
        impressions: followers * (5 + Math.random() * 10),
        influence: Math.floor(Math.random() * 100) + 1,
        authenticity: Math.floor(Math.random() * 30) + 70,
        growth_rate: Math.random() * 20 - 5, // -5% to +15%
      },
      verificationLevel: followers > 50000 ? 'premium' : followers > 10000 ? 'basic' : 'unverified',
      lastVerified: new Date().toISOString(),
      historicalMetrics: {
        followers_30d: Array.from({ length: 30 }, (_, i) => 
          followers - Math.floor(Math.random() * 1000) + i * 10
        ),
        engagement_30d: Array.from({ length: 30 }, () => 
          engagementRate + (Math.random() - 0.5) * 2
        ),
        growth_rate_30d: Math.random() * 20 - 5,
      },
    }
  }

  async getMetrics(username: string): Promise<InsightIQMetrics> {
    try {
      const profile = await this.getProfile(username)

      return {
        followers: profile.followers,
        engagement_rate: profile.engagement.avgEngagementRate,
        reach: profile.metrics.reach,
        influence_score: profile.metrics.influence,
        authenticity_score: profile.metrics.authenticity,
        growth_rate: profile.metrics.growth_rate,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
      throw error
    }
  }

  async verifyCreator(username: string, walletAddress: string): Promise<CreatorVerificationData> {
    try {
      const profile = await this.getProfile(username)
      const metrics = await this.getMetrics(username)

      // Determine verification level based on metrics
      let verificationLevel = 'unverified'
      if (profile.verified && metrics.authenticity_score > 80 && metrics.followers > 50000) {
        verificationLevel = 'elite'
      } else if (profile.verified && metrics.authenticity_score > 70 && metrics.followers > 10000) {
        verificationLevel = 'premium'
      } else if (profile.verified && metrics.authenticity_score > 60 && metrics.followers > 1000) {
        verificationLevel = 'basic'
      }

      // Generate milestone thresholds based on current metrics
      const currentFollowers = metrics.followers
      const followerMilestones = [
        Math.ceil(currentFollowers * 1.1),  // 10% growth
        Math.ceil(currentFollowers * 1.25), // 25% growth
        Math.ceil(currentFollowers * 1.5),  // 50% growth
        Math.ceil(currentFollowers * 2),    // 100% growth
      ]

      const currentEngagement = metrics.engagement_rate
      const engagementMilestones = [
        Math.ceil(currentEngagement * 1.1),  // 10% improvement
        Math.ceil(currentEngagement * 1.25), // 25% improvement
        Math.ceil(currentEngagement * 1.5),  // 50% improvement
      ]

      return {
        username,
        wallet_address: walletAddress,
        verification_level: verificationLevel,
        verified_at: new Date().toISOString(),
        metrics,
        milestones: {
          current_followers: currentFollowers,
          follower_milestones: followerMilestones,
          engagement_milestones: engagementMilestones,
        },
      }
    } catch (error) {
      console.error("Error verifying creator:", error)
      throw error
    }
  }

  generateJWT(creatorData: CreatorVerificationData): string {
    const payload: JWTPayload = {
      creator_wallet: creatorData.wallet_address,
      username: creatorData.username,
      verification_level: creatorData.verification_level,
      metrics: creatorData.metrics,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    }

    return jwt.sign(payload, this.jwtSecret)
  }

  verifyJWT(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload
    } catch (error) {
      console.error("JWT verification failed:", error)
      return null
    }
  }

  async updateMetrics(username: string): Promise<InsightIQMetrics> {
    try {
      // Force refresh metrics from the API
      const data = await this.makeRequest(`/creators/${username}/metrics/refresh`, {
        method: 'POST',
      })

      return {
        followers: data.followers,
        engagement_rate: data.engagement_rate,
        reach: data.reach,
        influence_score: data.influence_score,
        authenticity_score: data.authenticity_score,
        growth_rate: data.growth_rate,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error updating metrics:", error)
      // Fallback to getting cached metrics
      return await this.getMetrics(username)
    }
  }

  async isEligibleForTokenLaunch(username: string): Promise<{
    eligible: boolean
    reason?: string
    requirements: {
      minFollowers: number
      minAuthenticity: number
      minEngagement: number
      verified: boolean
    }
    currentMetrics: InsightIQMetrics
  }> {
    try {
      const profile = await this.getProfile(username)
      const metrics = await this.getMetrics(username)

      const requirements = {
        minFollowers: 1000,
        minAuthenticity: 60,
        minEngagement: 1,
        verified: true,
      }

      const checks = {
        hasEnoughFollowers: metrics.followers >= requirements.minFollowers,
        isAuthentic: metrics.authenticity_score >= requirements.minAuthenticity,
        hasEngagement: metrics.engagement_rate >= requirements.minEngagement,
        isVerified: profile.verified,
      }

      const eligible = Object.values(checks).every(Boolean)
      
      let reason: string | undefined
      if (!eligible) {
        if (!checks.isVerified) reason = "Account not verified on X (Twitter)"
        else if (!checks.hasEnoughFollowers) reason = `Need at least ${requirements.minFollowers} followers`
        else if (!checks.isAuthentic) reason = `Authenticity score too low (need ${requirements.minAuthenticity}+)`
        else if (!checks.hasEngagement) reason = `Engagement rate too low (need ${requirements.minEngagement}%+)`
      }

      return {
        eligible,
        reason,
        requirements,
        currentMetrics: metrics,
      }
    } catch (error) {
      console.error("Error checking eligibility:", error)
      return {
        eligible: false,
        reason: "Failed to verify account",
        requirements: {
          minFollowers: 1000,
          minAuthenticity: 60,
          minEngagement: 1,
          verified: true,
        },
        currentMetrics: {
          followers: 0,
          engagement_rate: 0,
          reach: 0,
          influence_score: 0,
          authenticity_score: 0,
          growth_rate: 0,
          lastUpdated: new Date().toISOString(),
        },
      }
    }
  }

  // Helper function to calculate token economics based on metrics
  calculateTokenomics(metrics: InsightIQMetrics): {
    initialSupply: number
    metricNames: string[]
    thresholds: number[]
    multipliers: number[]
  } {
    const baseSupply = Math.max(1000000, metrics.followers * 10) // Base supply related to followers

    // Metric-based tokenomics
    const metricNames = ['followers', 'engagement_rate', 'authenticity_score']
    
    // Thresholds for milestone rewards (increases from current values)
    const thresholds = [
      Math.ceil(metrics.followers * 1.25),    // 25% follower growth
      Math.ceil(metrics.engagement_rate * 1.5), // 50% engagement improvement  
      Math.ceil(metrics.authenticity_score * 1.1), // 10% authenticity improvement
    ]

    // Reward multipliers (percentage of current supply to mint)
    const multipliers = [
      15, // 15% supply increase for follower milestone
      10, // 10% supply increase for engagement milestone
      5,  // 5% supply increase for authenticity milestone
    ]

    return {
      initialSupply: baseSupply,
      metricNames,
      thresholds,
      multipliers,
    }
  }
}

// Export singleton instance
export const insightiq = new InsightIQClient()

// Export types
export type { 
  InsightIQProfile, 
  InsightIQMetrics, 
  CreatorVerificationData, 
  JWTPayload 
}
