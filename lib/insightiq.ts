// InsightIQ API client for social media metrics and multi-platform support
export interface InsightIQUser {
  id: string
  username: string
  platform: 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitch' | 'discord'
  followers: number
  engagementRate: number
  influenceScore: number
  profileImage?: string
  bio?: string
  isActive: boolean
  lastUpdated: Date
  // Enhanced platform-specific metrics
  platformMetrics?: {
    posts?: number
    likes?: number
    shares?: number
    comments?: number
    views?: number
    avgLikes?: number
    avgComments?: number
    avgShares?: number
    // Video-specific metrics
    videoViews?: number
    watchTime?: number
    subscribers?: number
    // Gaming/Discord specific
    serverMembers?: number
    messagesSent?: number
    // Professional metrics
    connections?: number
    endorsements?: number
  }
  // AI-powered insights
  aiInsights?: {
    contentCategories: string[]
    audienceDemographics: {
      ageGroups: Record<string, number>
      genderSplit: Record<string, number>
      topCountries: string[]
      languages: string[]
    }
    brandAffinities: string[]
    optimalPostTimes: string[]
    growthTrends: {
      followersGrowth: number
      engagementGrowth: number
      predictedGrowth: number
    }
    sentimentAnalysis: {
      positive: number
      neutral: number
      negative: number
    }
  }
}

export interface InsightIQVerification {
  verified: boolean
  tier: "nano" | "micro" | "macro" | "mega" | "celebrity"
  score: number
  requirements: {
    minFollowers: number
    minEngagementRate: number
    minInfluenceScore: number
  }
  platformRequirements?: {
    [key: string]: {
      minFollowers: number
      minEngagementRate: number
      platformSpecific?: Record<string, any>
    }
  }
  // Enhanced verification criteria
  crossPlatformScore?: number
  authenticityScore?: number
  brandSafetyScore?: number
}

export interface PlatformConfig {
  name: string
  displayName: string
  baseUrl: string
  rateLimit: number
  features: string[]
  metrics: string[]
  // Enhanced configuration
  supportsRealtime: boolean
  supportsAnalytics: boolean
  supportsAI: boolean
  webhookSupport: boolean
}

export const SUPPORTED_PLATFORMS: Record<string, PlatformConfig> = {
  twitter: {
    name: 'twitter',
    displayName: 'Twitter/X',
    baseUrl: 'https://api.twitter.com',
    rateLimit: 100,
    features: ['followers', 'engagement', 'influence', 'verification', 'analytics'],
    metrics: ['tweets', 'retweets', 'likes', 'replies', 'mentions', 'impressions'],
    supportsRealtime: true,
    supportsAnalytics: true,
    supportsAI: true,
    webhookSupport: true
  },
  instagram: {
    name: 'instagram',
    displayName: 'Instagram',
    baseUrl: 'https://graph.instagram.com',
    rateLimit: 60,
    features: ['followers', 'engagement', 'influence', 'stories', 'reels'],
    metrics: ['posts', 'likes', 'comments', 'shares', 'story_views', 'reel_plays'],
    supportsRealtime: true,
    supportsAnalytics: true,
    supportsAI: true,
    webhookSupport: true
  },
  tiktok: {
    name: 'tiktok',
    displayName: 'TikTok',
    baseUrl: 'https://open-api.tiktok.com',
    rateLimit: 50,
    features: ['followers', 'engagement', 'influence', 'viral_content'],
    metrics: ['videos', 'likes', 'shares', 'comments', 'views', 'duets'],
    supportsRealtime: true,
    supportsAnalytics: true,
    supportsAI: true,
    webhookSupport: true
  },
  youtube: {
    name: 'youtube',
    displayName: 'YouTube',
    baseUrl: 'https://www.googleapis.com/youtube',
    rateLimit: 80,
    features: ['subscribers', 'engagement', 'influence', 'monetization'],
    metrics: ['videos', 'views', 'likes', 'comments', 'subscribers', 'watch_time'],
    supportsRealtime: true,
    supportsAnalytics: true,
    supportsAI: true,
    webhookSupport: true
  },
  linkedin: {
    name: 'linkedin',
    displayName: 'LinkedIn',
    baseUrl: 'https://api.linkedin.com',
    rateLimit: 40,
    features: ['connections', 'engagement', 'influence', 'professional'],
    metrics: ['posts', 'likes', 'comments', 'shares', 'connections', 'profile_views'],
    supportsRealtime: false,
    supportsAnalytics: true,
    supportsAI: true,
    webhookSupport: false
  },
  twitch: {
    name: 'twitch',
    displayName: 'Twitch',
    baseUrl: 'https://api.twitch.tv',
    rateLimit: 60,
    features: ['followers', 'streaming', 'gaming', 'monetization'],
    metrics: ['streams', 'viewers', 'followers', 'subscribers', 'bits', 'donations'],
    supportsRealtime: true,
    supportsAnalytics: true,
    supportsAI: true,
    webhookSupport: true
  },
  discord: {
    name: 'discord',
    displayName: 'Discord',
    baseUrl: 'https://discord.com/api',
    rateLimit: 30,
    features: ['servers', 'community', 'engagement'],
    metrics: ['servers', 'members', 'messages', 'voice_time', 'reactions'],
    supportsRealtime: true,
    supportsAnalytics: false,
    supportsAI: true,
    webhookSupport: true
  }
}

class InsightIQClient {
  private baseUrl: string
  private apiKey: string
  private username?: string
  private password?: string

  constructor() {
    this.baseUrl = process.env.INSIGHTIQ_BASE_URL || "https://api.insightiq.com"
    this.apiKey = process.env.INSIGHTIQ_API_KEY || ""
    this.username = process.env.INSIGHTIQ_USERNAME
    this.password = process.env.INSIGHTIQ_PASSWORD
  }

  async getUserByUsername(username: string, platform: keyof typeof SUPPORTED_PLATFORMS = "twitter"): Promise<InsightIQUser | null> {
    try {
      // Validate platform
      if (!SUPPORTED_PLATFORMS[platform]) {
        throw new Error(`Unsupported platform: ${platform}`)
      }

      // Mock implementation for development
      if (!this.apiKey || this.apiKey === "mock") {
        return this.getMockUser(username, platform)
      }

      const response = await fetch(`${this.baseUrl}/users/${platform}/${username}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`InsightIQ API error: ${response.status}`)
      }

      const data = await response.json()
      return this.transformUserData(data)
    } catch (error) {
      console.error("Error fetching user from InsightIQ:", error)
      return null
    }
  }

  async getUserByMultiplePlatforms(username: string, platforms: string[] = ['twitter']): Promise<InsightIQUser[]> {
    try {
      const userPromises = platforms.map(platform => 
        this.getUserByUsername(username, platform as keyof typeof SUPPORTED_PLATFORMS)
      )
      
      const users = await Promise.all(userPromises)
      return users.filter(user => user !== null) as InsightIQUser[]
    } catch (error) {
      console.error("Error fetching multi-platform user data:", error)
      return []
    }
  }

  async verifyInfluencer(username: string, platform = "twitter"): Promise<InsightIQVerification> {
    try {
      const user = await this.getUserByUsername(username, platform)

      if (!user) {
        return {
          verified: false,
          tier: "nano",
          score: 0,
          requirements: {
            minFollowers: 1000,
            minEngagementRate: 0.01,
            minInfluenceScore: 50,
          },
        }
      }

      // Determine tier based on metrics
      const tier = this.calculateTier(user)
      const verified = this.checkVerificationCriteria(user)

      return {
        verified,
        tier,
        score: user.influenceScore,
        requirements: {
          minFollowers: 1000,
          minEngagementRate: 0.01,
          minInfluenceScore: 50,
        },
      }
    } catch (error) {
      console.error("Error verifying influencer:", error)
      return {
        verified: false,
        tier: "nano",
        score: 0,
        requirements: {
          minFollowers: 1000,
          minEngagementRate: 0.01,
          minInfluenceScore: 50,
        },
      }
    }
  }

  async getMetrics(username: string, platform = "twitter", metrics: string[] = []): Promise<any> {
    try {
      const user = await this.getUserByUsername(username, platform)

      if (!user) {
        return {}
      }

      const allMetrics = {
        followers: user.followers,
        engagement_rate: user.engagementRate,
        influence_score: user.influenceScore,
        platform: user.platform,
        is_active: user.isActive,
        last_updated: user.lastUpdated,
      }

      if (metrics.length === 0) {
        return allMetrics
      }

      const filteredMetrics: any = {}
      metrics.forEach((metric) => {
        if (allMetrics.hasOwnProperty(metric)) {
          filteredMetrics[metric] = allMetrics[metric as keyof typeof allMetrics]
        }
      })

      return filteredMetrics
    } catch (error) {
      console.error("Error getting metrics:", error)
      return {}
    }
  }

  async trackTokenMinting(tokenData: any, creatorData: InsightIQUser): Promise<void> {
    try {
      if (!this.apiKey || this.apiKey === "mock") {
        console.log("Mock: Token minting tracked", { tokenData, creatorData })
        return
      }

      await fetch(`${this.baseUrl}/events/token-minting`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: tokenData,
          creator: creatorData,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error("Error tracking token minting:", error)
    }
  }

  // Enhanced AI-powered analytics
  async getAIInsights(username: string, platform = "twitter"): Promise<any> {
    try {
      if (!this.apiKey || this.apiKey === "mock") {
        return this.getMockAIInsights(username, platform)
      }

      const response = await fetch(`${this.baseUrl}/users/${platform}/${username}/ai-insights`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`InsightIQ AI API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error getting AI insights:", error)
      return this.getMockAIInsights(username, platform)
    }
  }

  // Cross-platform verification
  async verifyCrossPlatform(username: string, platforms: string[] = ['twitter', 'instagram']): Promise<InsightIQVerification> {
    try {
      const users = await this.getUserByMultiplePlatforms(username, platforms)
      
      if (users.length === 0) {
        return {
          verified: false,
          tier: "nano",
          score: 0,
          requirements: {
            minFollowers: 1000,
            minEngagementRate: 0.01,
            minInfluenceScore: 50,
          },
        }
      }

      // Calculate cross-platform scores
      const totalFollowers = users.reduce((sum, user) => sum + user.followers, 0)
      const avgEngagement = users.reduce((sum, user) => sum + user.engagementRate, 0) / users.length
      const avgInfluence = users.reduce((sum, user) => sum + user.influenceScore, 0) / users.length
      
      // Cross-platform bonus multiplier
      const platformBonus = Math.min(users.length * 0.2, 1.0)
      const crossPlatformScore = avgInfluence * (1 + platformBonus)
      
      // Enhanced verification with cross-platform data
      const tier = this.calculateCrossPlatformTier(totalFollowers, avgEngagement, crossPlatformScore)
      const verified = totalFollowers >= 5000 && avgEngagement >= 0.02 && crossPlatformScore >= 60

      return {
        verified,
        tier,
        score: crossPlatformScore,
        crossPlatformScore,
        authenticityScore: this.calculateAuthenticityScore(users),
        brandSafetyScore: this.calculateBrandSafetyScore(users),
        requirements: {
          minFollowers: 5000,
          minEngagementRate: 0.02,
          minInfluenceScore: 60,
        },
        platformRequirements: platforms.reduce((acc, platform) => {
          acc[platform] = {
            minFollowers: SUPPORTED_PLATFORMS[platform]?.name === 'twitter' ? 1000 : 500,
            minEngagementRate: 0.015,
            platformSpecific: this.getPlatformSpecificRequirements(platform)
          }
          return acc
        }, {} as Record<string, any>)
      }
    } catch (error) {
      console.error("Error in cross-platform verification:", error)
      return {
        verified: false,
        tier: "nano",
        score: 0,
        requirements: {
          minFollowers: 1000,
          minEngagementRate: 0.01,
          minInfluenceScore: 50,
        },
      }
    }
  }

  // Real-time analytics for supported platforms
  async getRealTimeMetrics(username: string, platform = "twitter"): Promise<any> {
    try {
      const platformConfig = SUPPORTED_PLATFORMS[platform]
      if (!platformConfig?.supportsRealtime) {
        throw new Error(`Platform ${platform} does not support real-time metrics`)
      }

      if (!this.apiKey || this.apiKey === "mock") {
        return this.getMockRealTimeMetrics(username, platform)
      }

      const response = await fetch(`${this.baseUrl}/users/${platform}/${username}/realtime`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`InsightIQ Real-time API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error getting real-time metrics:", error)
      return this.getMockRealTimeMetrics(username, platform)
    }
  }

  // Content performance analytics
  async getContentAnalytics(username: string, platform = "twitter", timeframe = "30d"): Promise<any> {
    try {
      if (!this.apiKey || this.apiKey === "mock") {
        return this.getMockContentAnalytics(username, platform, timeframe)
      }

      const response = await fetch(`${this.baseUrl}/users/${platform}/${username}/content-analytics?timeframe=${timeframe}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`InsightIQ Content Analytics API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error getting content analytics:", error)
      return this.getMockContentAnalytics(username, platform, timeframe)
    }
  }

  private getMockUser(username: string, platform: keyof typeof SUPPORTED_PLATFORMS): InsightIQUser {
    // Generate consistent mock data based on username
    const hash = this.simpleHash(username)
    const followers = 1000 + (hash % 50000)
    const engagementRate = 0.01 + (hash % 100) / 1000
    const influenceScore = 30 + (hash % 70)

    return {
      id: `mock_${username}_${platform}`,
      username,
      platform: platform as InsightIQUser['platform'],
      followers,
      engagementRate,
      influenceScore,
      profileImage: "/placeholder-user.jpg",
      bio: `Mock bio for ${username}`,
      isActive: true,
      lastUpdated: new Date(),
    }
  }

  private transformUserData(data: any): InsightIQUser {
    return {
      id: data.id || `user_${Date.now()}`,
      username: data.username || data.handle,
      platform: (data.platform || "twitter") as InsightIQUser['platform'],
      followers: data.followers || data.follower_count || 0,
      engagementRate: data.engagement_rate || data.engagementRate || 0,
      influenceScore: data.influence_score || data.influenceScore || 0,
      profileImage: data.profile_image || data.avatar_url,
      bio: data.bio || data.description,
      isActive: data.is_active !== false,
      lastUpdated: new Date(data.last_updated || Date.now()),
    }
  }

  private calculateTier(user: InsightIQUser): "nano" | "micro" | "macro" | "mega" {
    if (user.followers >= 1000000) return "mega"
    if (user.followers >= 100000) return "macro"
    if (user.followers >= 10000) return "micro"
    return "nano"
  }

  private checkVerificationCriteria(user: InsightIQUser): boolean {
    return user.followers >= 1000 && user.engagementRate >= 0.01 && user.influenceScore >= 50
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  // Helper methods for calculations
  private calculateCrossPlatformTier(totalFollowers: number, avgEngagement: number, score: number): "nano" | "micro" | "macro" | "mega" | "celebrity" {
    if (totalFollowers >= 10000000 && score >= 90) return "celebrity"
    if (totalFollowers >= 1000000 && score >= 80) return "mega"
    if (totalFollowers >= 100000 && score >= 70) return "macro"
    if (totalFollowers >= 10000 && score >= 60) return "micro"
    return "nano"
  }

  private calculateAuthenticityScore(users: InsightIQUser[]): number {
    // Mock calculation - in real implementation this would analyze engagement patterns
    const baseScore = 75
    const platformDiversity = Math.min(users.length * 10, 25)
    return Math.min(baseScore + platformDiversity, 100)
  }

  private calculateBrandSafetyScore(users: InsightIQUser[]): number {
    // Mock calculation - in real implementation this would analyze content sentiment
    return 85 + Math.random() * 10
  }

  private getPlatformSpecificRequirements(platform: string): Record<string, any> {
    const requirements: Record<string, any> = {
      twitter: { minTweets: 100, minRetweets: 50 },
      instagram: { minPosts: 50, minStoryViews: 1000 },
      tiktok: { minVideos: 20, minLikes: 10000 },
      youtube: { minVideos: 10, minWatchTime: 4000 },
      linkedin: { minConnections: 500, minPosts: 20 },
      twitch: { minFollowers: 100, minStreamHours: 50 },
      discord: { minServers: 5, minMembers: 1000 }
    }
    return requirements[platform] || {}
  }

  // Mock data generators for development
  private getMockAIInsights(username: string, platform: keyof typeof SUPPORTED_PLATFORMS): any {
    return {
      contentCategories: ["technology", "lifestyle", "business"],
      audienceDemographics: {
        ageGroups: { "18-24": 25, "25-34": 40, "35-44": 20, "45+": 15 },
        genderSplit: { "male": 60, "female": 35, "other": 5 },
        topCountries: ["United States", "United Kingdom", "Canada"],
        languages: ["English", "Spanish", "French"]
      },
      brandAffinities: ["Tech Brands", "Lifestyle Brands", "Gaming"],
      optimalPostTimes: ["9:00 AM", "2:00 PM", "7:00 PM"],
      growthTrends: {
        followersGrowth: 15.5,
        engagementGrowth: 8.2,
        predictedGrowth: 22.3
      },
      sentimentAnalysis: {
        positive: 70,
        neutral: 25,
        negative: 5
      }
    }
  }

  private getMockRealTimeMetrics(username: string, platform: keyof typeof SUPPORTED_PLATFORMS): any {
    return {
      currentFollowers: 15000 + Math.floor(Math.random() * 1000),
      recentEngagement: 150 + Math.floor(Math.random() * 50),
      onlineStatus: Math.random() > 0.5 ? "online" : "offline",
      lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      trending: Math.random() > 0.8,
      platformSpecific: this.getPlatformSpecificRealTimeData(platform)
    }
  }

  private getMockContentAnalytics(username: string, platform: keyof typeof SUPPORTED_PLATFORMS, timeframe: string): any {
    return {
      topPerformingContent: [
        { id: "1", type: "post", engagement: 1250, reach: 15000 },
        { id: "2", type: "video", engagement: 2100, reach: 25000 },
        { id: "3", type: "story", engagement: 800, reach: 8000 }
      ],
      contentPerformance: {
        averageEngagement: 950,
        averageReach: 12000,
        bestPerformingTime: "2:00 PM",
        contentTypes: {
          posts: { count: 15, avgEngagement: 850 },
          videos: { count: 8, avgEngagement: 1200 },
          stories: { count: 20, avgEngagement: 600 }
        }
      },
      hashtags: {
        top: ["#tech", "#lifestyle", "#motivation"],
        performance: { "#tech": 1500, "#lifestyle": 1200, "#motivation": 800 }
      }
    }
  }

  private getPlatformSpecificRealTimeData(platform: string): any {
    const platformData: Record<string, any> = {
      twitter: { currentTweets: 1250, mentions: 45, impressions: 125000 },
      instagram: { stories: 5, reels: 3, igtv: 1 },
      tiktok: { videos: 25, duets: 8, challenges: 2 },
      youtube: { videos: 15, liveStreams: 0, premieres: 1 },
      linkedin: { posts: 8, articles: 2, connections: 1250 },
      twitch: { isLive: false, lastStream: "2 hours ago", subscribers: 850 },
      discord: { servers: 12, activeMembers: 450, messages: 2500 }
    }
    return platformData[platform] || {}
  }
}

// Export singleton instance
export const insightIQ = new InsightIQClient()

// Export for API routes
export const insightIQClient = {
  async verifyCreator(username: string, platform = "twitter") {
    try {
      const user = await insightIQ.getUserByUsername(username, platform)
      const verification = await insightIQ.verifyInfluencer(username, platform)

      return {
        success: true,
        data: {
          ...user,
          verified: verification.verified,
          tier: verification.tier,
          score: verification.score,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  },

  async getMetrics(username: string, platform = "twitter", metrics: string[] = []) {
    try {
      return await insightIQ.getMetrics(username, platform, metrics)
    } catch (error) {
      console.error("Error getting metrics:", error)
      return {}
    }
  },
}

export default insightIQ
