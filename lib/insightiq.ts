// InsightIQ API client for social media metrics
interface InsightIQUser {
  id: string
  username: string
  platform: string
  followers: number
  engagementRate: number
  influenceScore: number
  profileImage?: string
  bio?: string
  isActive: boolean
  lastUpdated: Date
}

interface InsightIQVerification {
  verified: boolean
  tier: "nano" | "micro" | "macro" | "mega"
  score: number
  requirements: {
    minFollowers: number
    minEngagementRate: number
    minInfluenceScore: number
  }
}

class InsightIQClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.INSIGHTIQ_BASE_URL || "https://api.insightiq.com"
    this.apiKey = process.env.INSIGHTIQ_API_KEY || ""
  }

  async getUserByUsername(username: string, platform = "twitter"): Promise<InsightIQUser | null> {
    try {
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
        throw new Error(`InsightIQ API error: ${response.status}`)
      }

      const data = await response.json()
      return this.transformUserData(data)
    } catch (error) {
      console.error("Error fetching user from InsightIQ:", error)
      return this.getMockUser(username, platform)
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

  private getMockUser(username: string, platform: string): InsightIQUser {
    // Generate consistent mock data based on username
    const hash = this.simpleHash(username)
    const followers = 1000 + (hash % 50000)
    const engagementRate = 0.01 + (hash % 100) / 1000
    const influenceScore = 30 + (hash % 70)

    return {
      id: `mock_${username}_${platform}`,
      username,
      platform,
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
      platform: data.platform || "twitter",
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
