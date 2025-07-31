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
  }
}

interface InsightIQMetrics {
  followers: number
  engagement: number
  reach: number
  influence: number
  authenticity: number
  lastUpdated: string
}

class InsightIQClient {
  private baseUrl: string
  private clientId: string
  private clientSecret: string

  constructor() {
    this.baseUrl = process.env.INSIGHTIQ_BASE_URL || "https://api.insightiq.com"
    this.clientId = process.env.INSIGHTIQ_CLIENT_ID || ""
    this.clientSecret = process.env.INSIGHTIQ_CLIENT_SECRET || ""
  }

  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: "client_credentials",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get access token")
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error("Error getting access token:", error)
      throw new Error("Failed to authenticate with InsightIQ")
    }
  }

  async getProfile(username: string): Promise<InsightIQProfile> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.baseUrl}/v1/profiles/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Profile not found")
        }
        throw new Error("Failed to fetch profile")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching profile:", error)

      // Return mock data for development
      return {
        id: `mock_${username}`,
        username,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        profileImage: `/placeholder.svg?height=100&width=100`,
        verified: Math.random() > 0.5,
        followers: Math.floor(Math.random() * 100000) + 1000,
        following: Math.floor(Math.random() * 5000) + 100,
        tweets: Math.floor(Math.random() * 10000) + 500,
        engagement: {
          likes: Math.floor(Math.random() * 50000),
          retweets: Math.floor(Math.random() * 10000),
          replies: Math.floor(Math.random() * 5000),
          avgEngagementRate: Math.random() * 10 + 1,
        },
        metrics: {
          reach: Math.floor(Math.random() * 1000000) + 10000,
          impressions: Math.floor(Math.random() * 5000000) + 50000,
          influence: Math.floor(Math.random() * 100) + 1,
          authenticity: Math.floor(Math.random() * 100) + 1,
        },
      }
    }
  }

  async getMetrics(username: string): Promise<InsightIQMetrics> {
    try {
      const profile = await this.getProfile(username)

      return {
        followers: profile.followers,
        engagement: profile.engagement.avgEngagementRate,
        reach: profile.metrics.reach,
        influence: profile.metrics.influence,
        authenticity: profile.metrics.authenticity,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
      throw error
    }
  }

  async verifyProfile(username: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(username)
      return profile.verified && profile.metrics.authenticity > 70
    } catch (error) {
      console.error("Error verifying profile:", error)
      return false
    }
  }

  async updateMetrics(username: string): Promise<InsightIQMetrics> {
    try {
      // In a real implementation, this would trigger a metrics refresh
      return await this.getMetrics(username)
    } catch (error) {
      console.error("Error updating metrics:", error)
      throw error
    }
  }
}

export const insightiq = new InsightIQClient()
export type { InsightIQProfile, InsightIQMetrics }
