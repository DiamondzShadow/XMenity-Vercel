import { type NextRequest, NextResponse } from "next/server"
import { firebaseOperations } from "@/lib/firebase"
import { insightiq } from "@/lib/insightiq"
import { Web3Utils } from "@/lib/web3"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get("tokenId")
    const contractAddress = searchParams.get("contractAddress")
    const creatorWallet = searchParams.get("creatorWallet")
    const period = searchParams.get("period") || "30d" // 7d, 30d, 90d

    if (!tokenId && !contractAddress && !creatorWallet) {
      return NextResponse.json({
        success: false,
        error: "Either tokenId, contractAddress, or creatorWallet is required"
      }, { status: 400 })
    }

    let tokenData
    let tokens = []

    if (tokenId) {
      tokenData = await firebaseOperations.getTokenById(tokenId)
      if (tokenData) tokens = [tokenData]
    } else if (contractAddress) {
      const allTokens = await firebaseOperations.getTokens(1000)
      tokenData = allTokens.find(token => 
        token.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
      )
      if (tokenData) tokens = [tokenData]
    } else if (creatorWallet) {
      tokens = await firebaseOperations.getTokensByCreator(creatorWallet)
    }

    if (tokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No tokens found"
      }, { status: 404 })
    }

    // Aggregate analytics data
    const analytics = await Promise.all(
      tokens.map(async (token) => {
        try {
          const tokenAnalytics = await generateTokenAnalytics(token, period)
          return tokenAnalytics
        } catch (error) {
          console.error(`Failed to generate analytics for token ${token.id}:`, error)
          return null
        }
      })
    )

    const validAnalytics = analytics.filter(Boolean)

    if (tokenId || contractAddress) {
      // Return single token analytics
      return NextResponse.json({
        success: true,
        analytics: validAnalytics[0] || null,
      })
    } else {
      // Return aggregated analytics for creator
      const aggregated = aggregateCreatorAnalytics(validAnalytics)
      return NextResponse.json({
        success: true,
        analytics: aggregated,
        tokens: validAnalytics,
      })
    }
  } catch (error) {
    console.error("Analytics generation failed:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to generate analytics"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokenId, contractAddress, jwtToken } = body

    if (!tokenId && !contractAddress) {
      return NextResponse.json({
        success: false,
        error: "Either tokenId or contractAddress is required"
      }, { status: 400 })
    }

    // Verify JWT if provided
    if (jwtToken) {
      const jwtPayload = insightiq.verifyJWT(jwtToken)
      if (!jwtPayload) {
        return NextResponse.json({
          success: false,
          error: "Invalid or expired authentication token"
        }, { status: 401 })
      }
    }

    // Get token data
    let tokenData
    if (tokenId) {
      tokenData = await firebaseOperations.getTokenById(tokenId)
    } else {
      const tokens = await firebaseOperations.getTokens(1000)
      tokenData = tokens.find(token => 
        token.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
      )
    }

    if (!tokenData) {
      return NextResponse.json({
        success: false,
        error: "Token not found"
      }, { status: 404 })
    }

    // Refresh metrics from InsightIQ
    let updatedMetrics = null
    if (tokenData.creatorUsername) {
      try {
        updatedMetrics = await insightiq.updateMetrics(tokenData.creatorUsername)
      } catch (error) {
        console.error("Failed to update metrics:", error)
      }
    }

    // Update contract metrics if deployed
    let contractInfo = null
    if (tokenData.deployed && tokenData.contractAddress) {
      try {
        contractInfo = await Web3Utils.getTokenInfo(tokenData.contractAddress)
      } catch (error) {
        console.error("Failed to get contract info:", error)
      }
    }

    // Update token data in Firebase
    const updatedTokenData = {
      ...tokenData,
      ...(updatedMetrics && { metrics: updatedMetrics }),
      ...(contractInfo && contractInfo),
      lastUpdated: new Date().toISOString(),
    }

    await firebaseOperations.updateToken(tokenData.id, updatedTokenData)

    // Generate fresh analytics
    const analytics = await generateTokenAnalytics(updatedTokenData, "30d")

    return NextResponse.json({
      success: true,
      analytics,
      message: "Analytics refreshed successfully"
    })
  } catch (error) {
    console.error("Analytics refresh failed:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to refresh analytics"
    }, { status: 500 })
  }
}

// Helper function to generate token analytics
async function generateTokenAnalytics(token: any, period: string) {
  const now = new Date()
  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90

  // Mock historical data for demonstration
  // In a real implementation, this would come from stored historical data
  const historicalData = generateMockHistoricalData(token, periodDays)

  // Current metrics
  const currentMetrics = {
    followers: token.metrics?.followers || 0,
    engagement_rate: token.metrics?.engagement_rate || 0,
    authenticity_score: token.metrics?.authenticity_score || 0,
    influence_score: token.metrics?.influence_score || 0,
    reach: token.metrics?.reach || 0,
  }

  // Token performance
  const tokenPerformance = {
    current_price: parseFloat(token.currentPrice || "0.01"),
    market_cap: parseFloat(token.marketCap || "0"),
    holders_count: token.holdersCount || 0,
    total_supply: parseFloat(token.totalSupply || token.initialSupply || "0"),
    volume_24h: parseFloat(token.volume24h || "0"),
  }

  // Milestone progress
  const milestoneProgress = calculateMilestoneProgress(token)

  // Growth metrics
  const growthMetrics = calculateGrowthMetrics(historicalData, currentMetrics, periodDays)

  // Performance score
  const performanceScore = calculatePerformanceScore(currentMetrics, growthMetrics, milestoneProgress)

  return {
    token_id: token.id,
    name: token.name,
    symbol: token.symbol,
    contract_address: token.contractAddress,
    creator_wallet: token.creatorWallet,
    creator_username: token.creatorUsername,
    verification_level: token.verificationLevel,
    deployed: token.deployed,
    created_at: token.createdAt,
    period,
    current_metrics: currentMetrics,
    token_performance: tokenPerformance,
    milestone_progress: milestoneProgress,
    growth_metrics: growthMetrics,
    performance_score: performanceScore,
    historical_data: historicalData,
    last_updated: new Date().toISOString(),
  }
}

// Helper function to aggregate creator analytics
function aggregateCreatorAnalytics(tokenAnalytics: any[]) {
  if (tokenAnalytics.length === 0) return null

  const totalTokens = tokenAnalytics.length
  const deployedTokens = tokenAnalytics.filter(t => t.deployed).length
  
  const totalMarketCap = tokenAnalytics.reduce((sum, t) => sum + (t.token_performance?.market_cap || 0), 0)
  const totalVolume = tokenAnalytics.reduce((sum, t) => sum + (t.token_performance?.volume_24h || 0), 0)
  const totalHolders = tokenAnalytics.reduce((sum, t) => sum + (t.token_performance?.holders_count || 0), 0)
  
  const avgPerformanceScore = tokenAnalytics.reduce((sum, t) => sum + (t.performance_score || 0), 0) / totalTokens
  
  // Get latest metrics from most recent token
  const latestToken = tokenAnalytics.sort((a, b) => 
    new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
  )[0]

  return {
    creator_wallet: latestToken.creator_wallet,
    creator_username: latestToken.creator_username,
    verification_level: latestToken.verification_level,
    total_tokens: totalTokens,
    deployed_tokens: deployedTokens,
    total_market_cap: totalMarketCap,
    total_volume_24h: totalVolume,
    total_holders: totalHolders,
    avg_performance_score: avgPerformanceScore,
    current_metrics: latestToken.current_metrics,
    tokens: tokenAnalytics,
    last_updated: new Date().toISOString(),
  }
}

// Helper function to generate mock historical data
function generateMockHistoricalData(token: any, days: number) {
  const data = []
  const currentDate = new Date()
  
  const baseFollowers = token.metrics?.followers || 1000
  const baseEngagement = token.metrics?.engagement_rate || 3
  const basePrice = parseFloat(token.currentPrice || "0.01")
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(currentDate)
    date.setDate(date.getDate() - i)
    
    // Add some realistic variation
    const followerVariation = 1 + (Math.random() - 0.5) * 0.1 // ±5%
    const engagementVariation = 1 + (Math.random() - 0.5) * 0.3 // ±15%
    const priceVariation = 1 + (Math.random() - 0.5) * 0.2 // ±10%
    
    data.push({
      date: date.toISOString().split('T')[0],
      followers: Math.floor(baseFollowers * followerVariation * (1 - i * 0.001)), // Slight growth trend
      engagement_rate: Math.max(0.1, baseEngagement * engagementVariation),
      token_price: Math.max(0.001, basePrice * priceVariation),
      volume: Math.random() * 10000,
      holders: Math.floor((token.holdersCount || 1) * (1 - i * 0.01)),
    })
  }
  
  return data
}

// Helper function to calculate milestone progress
function calculateMilestoneProgress(token: any) {
  if (!token.milestones || !token.metrics) {
    return {
      completed_milestones: 0,
      next_milestone: null,
      progress_percentage: 0,
    }
  }

  const current = token.milestones.current || {}
  const targets = token.milestones.targets || {}
  
  const milestones = [
    {
      type: 'followers',
      current: current.followers || token.metrics.followers || 0,
      target: targets.followers || 0,
      reward: '25% supply increase'
    },
    {
      type: 'engagement_rate',
      current: current.engagement_rate || token.metrics.engagement_rate || 0,
      target: targets.engagement_rate || 0,
      reward: '15% supply increase'
    },
    {
      type: 'authenticity_score',
      current: current.authenticity_score || token.metrics.authenticity_score || 0,
      target: targets.authenticity_score || 0,
      reward: '10% supply increase'
    }
  ]

  const completedMilestones = milestones.filter(m => m.current >= m.target).length
  const nextMilestone = milestones.find(m => m.current < m.target)
  
  let progressPercentage = 0
  if (nextMilestone) {
    progressPercentage = (nextMilestone.current / nextMilestone.target) * 100
  }

  return {
    completed_milestones: completedMilestones,
    total_milestones: milestones.length,
    next_milestone: nextMilestone,
    progress_percentage: Math.min(100, progressPercentage),
    milestones,
  }
}

// Helper function to calculate growth metrics
function calculateGrowthMetrics(historicalData: any[], currentMetrics: any, days: number) {
  if (historicalData.length === 0) {
    return {
      follower_growth: 0,
      engagement_growth: 0,
      price_growth: 0,
      volume_growth: 0,
    }
  }

  const firstData = historicalData[0]
  const lastData = historicalData[historicalData.length - 1]
  
  const followerGrowth = ((lastData.followers - firstData.followers) / firstData.followers) * 100
  const engagementGrowth = ((lastData.engagement_rate - firstData.engagement_rate) / firstData.engagement_rate) * 100
  const priceGrowth = ((lastData.token_price - firstData.token_price) / firstData.token_price) * 100
  
  const avgVolume = historicalData.reduce((sum, d) => sum + d.volume, 0) / historicalData.length
  const recentAvgVolume = historicalData.slice(-7).reduce((sum, d) => sum + d.volume, 0) / 7
  const volumeGrowth = avgVolume > 0 ? ((recentAvgVolume - avgVolume) / avgVolume) * 100 : 0

  return {
    follower_growth: parseFloat(followerGrowth.toFixed(2)),
    engagement_growth: parseFloat(engagementGrowth.toFixed(2)),
    price_growth: parseFloat(priceGrowth.toFixed(2)),
    volume_growth: parseFloat(volumeGrowth.toFixed(2)),
    period_days: days,
  }
}

// Helper function to calculate performance score
function calculatePerformanceScore(currentMetrics: any, growthMetrics: any, milestoneProgress: any) {
  // Score components (0-100 each)
  const followerScore = Math.min(100, (currentMetrics.followers / 10000) * 100) // Max at 10k followers
  const engagementScore = Math.min(100, (currentMetrics.engagement_rate / 10) * 100) // Max at 10% engagement
  const authenticityScore = currentMetrics.authenticity_score
  const influenceScore = currentMetrics.influence_score
  
  const growthScore = Math.min(100, Math.max(0, 
    ((growthMetrics.follower_growth + growthMetrics.engagement_growth) / 2) + 50
  ))
  
  const milestoneScore = (milestoneProgress.completed_milestones / milestoneProgress.total_milestones) * 100

  // Weighted average
  const weights = {
    followers: 0.2,
    engagement: 0.25,
    authenticity: 0.15,
    influence: 0.15,
    growth: 0.15,
    milestones: 0.1,
  }

  const totalScore = 
    followerScore * weights.followers +
    engagementScore * weights.engagement +
    authenticityScore * weights.authenticity +
    influenceScore * weights.influence +
    growthScore * weights.growth +
    milestoneScore * weights.milestones

  return Math.round(Math.min(100, Math.max(0, totalScore)))
}