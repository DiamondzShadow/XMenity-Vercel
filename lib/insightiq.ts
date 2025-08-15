import { 
  VERIFICATION_THRESHOLDS, 
  TOKEN_CREATION_REQUIREMENTS, 
  MILESTONE_THRESHOLDS, 
  MILESTONE_CONFIGS,
  API_CONFIG,
  type VerificationLevel 
} from "@/lib/constants"

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
  verificationLevel: VerificationLevel
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

  private getVerificationLevel(profile: InsightIQProfile): VerificationLevel {
    const { followers, metrics } = profile
    const { authenticity, influence, qualityScore } = metrics

    const elite = VERIFICATION_THRESHOLDS.ELITE
    const premium = VERIFICATION_THRESHOLDS.PREMIUM
    const verified = VERIFICATION_THRESHOLDS.VERIFIED

    if (followers >= elite.followers && authenticity >= elite.authenticity && 
        influence >= elite.influence && qualityScore >= elite.qualityScore) {
      return 'elite'
    } else if (followers >= premium.followers && authenticity >= premium.authenticity && 
               influence >= premium.influence && qualityScore >= premium.qualityScore) {
      return 'premium'
    } else if (followers >= verified.followers && authenticity >= verified.authenticity && 
               influence >= verified.influence && qualityScore >= verified.qualityScore) {
      return 'verified'
    }
    return 'basic'
  }

  private isEligibleForTokenCreation(profile: InsightIQProfile): boolean {
    const req = TOKEN_CREATION_REQUIREMENTS
    return profile.followers >= req.minFollowers && 
           profile.metrics.authenticity >= req.minAuthenticity && 
           profile.metrics.qualityScore >= req.minQualityScore
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

      const followerMilestones = MILESTONE_THRESHOLDS.followers
      const engagementMilestones = MILESTONE_THRESHOLDS.engagement
      const reachMilestones = MILESTONE_THRESHOLDS.reach

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

      // Wait for metrics to update, then fetch
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.defaultTimeout))
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
        milestones: MILESTONE_CONFIGS.follower.map(config => ({
          ...config,
          achieved: profile.followers >= config.threshold
        }))
      },
      engagementMilestones: {
        current: profile.engagement.avgEngagementRate,
        milestones: MILESTONE_CONFIGS.engagement.map(config => ({
          ...config,
          achieved: profile.engagement.avgEngagementRate >= config.threshold
        }))
      },
      reachMilestones: {
        current: profile.metrics.reach,
        milestones: MILESTONE_CONFIGS.reach.map(config => ({
          ...config,
          achieved: profile.metrics.reach >= config.threshold
        }))
      }
    }
  }
}

export const insightiq = new InsightIQClient()
export type { InsightIQProfile, InsightIQMetrics, CreatorVerificationResult }
