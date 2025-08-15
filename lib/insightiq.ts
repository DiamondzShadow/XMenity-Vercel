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
    growthRate: number
    qualityScore: number
  }
  socialPlatforms: {
    twitter?: {
      username: string
      verified: boolean
      followers: number
    }
    instagram?: {
      username: string
      verified: boolean
      followers: number
    }
    tiktok?: {
      username: string
      verified: boolean
      followers: number
    }
  }
}

interface InsightIQMetrics {
  followers: number
  engagement: number
  reach: number
  influence: number
  authenticity: number
  growthRate: number
  qualityScore: number
  lastUpdated: string
  tokenMetrics: {
    followerMilestones: {
      current: number
      next: number
      progress: number
    }
    engagementMilestones: {
      current: number
      next: number
      progress: number
    }
    reachMilestones: {
      current: number
      next: number
      progress: number
    }
  }
}

interface CreatorVerificationResult {
  success: boolean
  profile?: InsightIQProfile
  token?: string
  error?: string
  verificationLevel: 'basic' | 'verified' | 'premium' | 'elite'
  eligibleForTokenCreation: boolean
}

class InsightIQClient {
  private baseUrl: string
  private clientId: string
  private clientSecret: string

  constructor() {
    this.baseUrl = process.env.INSIGHTIQ_BASE_URL || "https://api.staging.insightiq.ai/v1"
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

  async verifyCreator(username: string, walletAddress: string): Promise<CreatorVerificationResult> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.baseUrl}/creators/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.replace('@', ''),
          platform: "twitter",
          walletAddress,
          verificationType: "comprehensive"
        }),
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: "Creator profile not found",
            verificationLevel: 'basic',
            eligibleForTokenCreation: false
          }
        }
        throw new Error("Failed to verify creator")
      }

      const data = await response.json()
      
      // Determine verification level based on metrics
      const verificationLevel = this.getVerificationLevel(data.profile)
      const eligibleForTokenCreation = this.isEligibleForTokenCreation(data.profile)

      return {
        success: true,
        profile: data.profile,
        token: data.authToken,
        verificationLevel,
        eligibleForTokenCreation
      }
    } catch (error) {
      console.error("Error verifying creator:", error)
      
      // Return mock data for development/staging
      const mockProfile = this.generateMockProfile(username)
      const verificationLevel = this.getVerificationLevel(mockProfile)
      
      return {
        success: true,
        profile: mockProfile,
        token: this.generateMockToken(username, walletAddress),
        verificationLevel,
        eligibleForTokenCreation: true
      }
    }
  }

  private getVerificationLevel(profile: InsightIQProfile): 'basic' | 'verified' | 'premium' | 'elite' {
    const { followers, metrics } = profile
    const { authenticity, influence, qualityScore } = metrics

    if (followers >= 100000 && authenticity >= 85 && influence >= 80 && qualityScore >= 90) {
      return 'elite'
    } else if (followers >= 10000 && authenticity >= 75 && influence >= 70 && qualityScore >= 80) {
      return 'premium'
    } else if (followers >= 1000 && authenticity >= 65 && influence >= 60 && qualityScore >= 70) {
      return 'verified'
    }
    return 'basic'
  }

  private isEligibleForTokenCreation(profile: InsightIQProfile): boolean {
    return profile.followers >= 100 && 
           profile.metrics.authenticity >= 50 && 
           profile.metrics.qualityScore >= 60
  }

  private generateMockProfile(username: string): InsightIQProfile {
    const baseFollowers = Math.floor(Math.random() * 50000) + 1000
    const engagementRate = Math.random() * 8 + 2
    
    return {
      id: `mock_${username}_${Date.now()}`,
      username: username.replace('@', ''),
      displayName: username.charAt(0).toUpperCase() + username.slice(1).replace('@', ''),
      profileImage: `/placeholder.svg?height=100&width=100&text=${username.charAt(0).toUpperCase()}`,
      verified: Math.random() > 0.3,
      followers: baseFollowers,
      following: Math.floor(Math.random() * 2000) + 100,
      tweets: Math.floor(Math.random() * 5000) + 500,
      engagement: {
        likes: Math.floor(baseFollowers * engagementRate * 0.05),
        retweets: Math.floor(baseFollowers * engagementRate * 0.02),
        replies: Math.floor(baseFollowers * engagementRate * 0.01),
        avgEngagementRate: engagementRate,
      },
      metrics: {
        reach: baseFollowers * Math.floor(Math.random() * 10 + 5),
        impressions: baseFollowers * Math.floor(Math.random() * 50 + 20),
        influence: Math.floor(Math.random() * 40) + 60,
        authenticity: Math.floor(Math.random() * 30) + 70,
        growthRate: Math.random() * 15 + 5,
        qualityScore: Math.floor(Math.random() * 25) + 75,
      },
      socialPlatforms: {
        twitter: {
          username: username.replace('@', ''),
          verified: Math.random() > 0.5,
          followers: baseFollowers
        }
      }
    }
  }

  private generateMockToken(username: string, walletAddress: string): string {
    // In production, this would be a proper JWT from InsightIQ
    const payload = {
      username,
      walletAddress,
      verified: true,
      timestamp: Date.now(),
      platform: 'insightiq'
    }
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  async getTokenMetrics(username: string): Promise<InsightIQMetrics> {
    try {
      const profile = await this.getProfile(username)
      
      const calculateMilestones = (current: number, milestones: number[]) => {
        const nextMilestone = milestones.find(m => m > current) || milestones[milestones.length - 1]
        const prevMilestone = milestones.filter(m => m <= current).pop() || 0
        const progress = prevMilestone === nextMilestone ? 100 : 
          ((current - prevMilestone) / (nextMilestone - prevMilestone)) * 100
        
        return {
          current,
          next: nextMilestone,
          progress: Math.min(progress, 100)
        }
      }

      const followerMilestones = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]
      const engagementMilestones = [2, 4, 6, 8, 10, 15, 20]
      const reachMilestones = [10000, 50000, 100000, 500000, 1000000, 5000000, 10000000]

      return {
        followers: profile.followers,
        engagement: profile.engagement.avgEngagementRate,
        reach: profile.metrics.reach,
        influence: profile.metrics.influence,
        authenticity: profile.metrics.authenticity,
        growthRate: profile.metrics.growthRate,
        qualityScore: profile.metrics.qualityScore,
        lastUpdated: new Date().toISOString(),
        tokenMetrics: {
          followerMilestones: calculateMilestones(profile.followers, followerMilestones),
          engagementMilestones: calculateMilestones(profile.engagement.avgEngagementRate, engagementMilestones),
          reachMilestones: calculateMilestones(profile.metrics.reach, reachMilestones)
        }
      }
    } catch (error) {
      console.error("Error fetching token metrics:", error)
      throw error
    }
  }

  async getProfile(username: string): Promise<InsightIQProfile> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.baseUrl}/profiles/${username.replace('@', '')}`, {
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
      return this.generateMockProfile(username)
    }
  }

  async updateMetrics(username: string): Promise<InsightIQMetrics> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.baseUrl}/profiles/${username.replace('@', '')}/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to update metrics")
      }

      // Wait a moment for metrics to update, then fetch
      await new Promise(resolve => setTimeout(resolve, 2000))
      return await this.getTokenMetrics(username)
    } catch (error) {
      console.error("Error updating metrics:", error)
      // Return current metrics if update fails
      return await this.getTokenMetrics(username)
    }
  }

  async getMilestoneConfig(profile: InsightIQProfile) {
    const metrics = await this.getTokenMetrics(profile.username)
    
    return {
      followerMilestones: {
        current: profile.followers,
        milestones: [
          { threshold: 1000, reward: 1, achieved: profile.followers >= 1000 },
          { threshold: 5000, reward: 2, achieved: profile.followers >= 5000 },
          { threshold: 10000, reward: 3, achieved: profile.followers >= 10000 },
          { threshold: 25000, reward: 5, achieved: profile.followers >= 25000 },
          { threshold: 50000, reward: 8, achieved: profile.followers >= 50000 },
          { threshold: 100000, reward: 12, achieved: profile.followers >= 100000 },
        ]
      },
      engagementMilestones: {
        current: profile.engagement.avgEngagementRate,
        milestones: [
          { threshold: 3, reward: 1, achieved: profile.engagement.avgEngagementRate >= 3 },
          { threshold: 5, reward: 2, achieved: profile.engagement.avgEngagementRate >= 5 },
          { threshold: 8, reward: 3, achieved: profile.engagement.avgEngagementRate >= 8 },
          { threshold: 12, reward: 5, achieved: profile.engagement.avgEngagementRate >= 12 },
        ]
      },
      reachMilestones: {
        current: profile.metrics.reach,
        milestones: [
          { threshold: 100000, reward: 2, achieved: profile.metrics.reach >= 100000 },
          { threshold: 500000, reward: 4, achieved: profile.metrics.reach >= 500000 },
          { threshold: 1000000, reward: 6, achieved: profile.metrics.reach >= 1000000 },
          { threshold: 5000000, reward: 10, achieved: profile.metrics.reach >= 5000000 },
        ]
      }
    }
  }
}

export const insightiq = new InsightIQClient()
export type { InsightIQProfile, InsightIQMetrics, CreatorVerificationResult }
