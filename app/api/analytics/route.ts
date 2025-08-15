import { type NextRequest, NextResponse } from "next/server"
import { supabaseOperations } from "@/lib/supabase"
import { insightIQ } from "@/lib/insightiq"
import jwt from "jsonwebtoken"

// Authentication helper
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) {
    throw new Error('Access token required')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// GET route for analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractAddress = searchParams.get("contractAddress")
    const period = searchParams.get("period") || "30d"
    const type = searchParams.get("type") || "token"

    if (!contractAddress) {
      return NextResponse.json({ success: false, error: "Contract address required" }, { status: 400 })
    }

    // Get token data using efficient query
    const tokenData = await supabaseOperations.getTokenByContractAddress(contractAddress)
    
    if (!tokenData) {
      return NextResponse.json({ success: false, error: "Token not found" }, { status: 404 })
    }

    // Get real analytics data instead of mock data
    const analytics = await generateTokenAnalytics(tokenData, period)

    return NextResponse.json({
      success: true,
      analytics,
      token: tokenData,
    })
  } catch (error) {
    console.error("Analytics fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 })
  }
}

// POST route for updating analytics
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    await verifyToken(request)

    const body = await request.json()
    const {
      contractAddress,
      metrics,
      period = "30d"
    } = body

    if (!contractAddress) {
      return NextResponse.json({ success: false, error: "Contract address required" }, { status: 400 })
    }

    // Get token using efficient query
    const tokenData = await supabaseOperations.getTokenByContractAddress(contractAddress)
    
    if (!tokenData) {
      return NextResponse.json({ success: false, error: "Token not found" }, { status: 404 })
    }

    // Save analytics data
    const analyticsData = {
      token_id: tokenData.id,
      period,
      metrics,
      price_data: metrics.priceData || {},
      volume_data: metrics.volumeData || {},
      holder_data: metrics.holderData || {},
    }

    await supabaseOperations.saveAnalyticsData(analyticsData)

    return NextResponse.json({
      success: true,
      message: "Analytics updated successfully",
    })
  } catch (error) {
    console.error("Analytics update error:", error)
    return NextResponse.json({ success: false, error: "Failed to update analytics" }, { status: 500 })
  }
}

// Helper function to generate real analytics data
async function generateTokenAnalytics(token: any, period: string) {
  try {
    const periodDays = getPeriodDays(period)
    
    // Get real historical analytics data
    const historicalData = await getHistoricalData(token, periodDays)
    
    if (historicalData.length === 0) {
      // If no historical data exists, create initial data point
      const initialData = await createInitialAnalyticsData(token)
      await supabaseOperations.saveAnalyticsData(initialData)
      return {
        performance: {
          score: 0,
          trend: "stable",
          change: 0
        },
        growth: {
          followers: 0,
          engagement: 0,
          price: 0
        },
        metrics: {
          totalSupply: token.totalSupply || "0",
          holdersCount: token.holdersCount || 0,
          marketCap: token.marketCap || "0",
          currentPrice: token.currentPrice || "0.01"
        },
        historical: [initialData]
      }
    }

    const firstData = historicalData[historicalData.length - 1]
    const lastData = historicalData[0]

    // Calculate growth with division by zero protection
    const followerGrowth = firstData.followers > 0 ? 
      ((lastData.followers - firstData.followers) / firstData.followers) * 100 : 0
    const engagementGrowth = firstData.engagement_rate > 0 ? 
      ((lastData.engagement_rate - firstData.engagement_rate) / firstData.engagement_rate) * 100 : 0
    const priceGrowth = firstData.token_price > 0 ? 
      ((lastData.token_price - firstData.token_price) / firstData.token_price) * 100 : 0

    // Calculate performance score
    const performanceScore = calculatePerformanceScore({
      followerGrowth,
      engagementGrowth,
      priceGrowth,
      currentMetrics: lastData
    })

    // Determine trend
    const trend = priceGrowth > 5 ? "bullish" : priceGrowth < -5 ? "bearish" : "stable"

    return {
      performance: {
        score: Math.round(performanceScore),
        trend,
        change: Math.round(priceGrowth * 100) / 100
      },
      growth: {
        followers: Math.round(followerGrowth * 100) / 100,
        engagement: Math.round(engagementGrowth * 100) / 100,
        price: Math.round(priceGrowth * 100) / 100
      },
      metrics: {
        totalSupply: token.totalSupply || "0",
        holdersCount: lastData.holders_count || token.holdersCount || 0,
        marketCap: calculateMarketCap(token.totalSupply, lastData.token_price),
        currentPrice: lastData.token_price?.toString() || token.currentPrice || "0.01"
      },
      historical: historicalData
    }
  } catch (error) {
    console.error("Error generating analytics:", error)
    throw error
  }
}

// Get real historical data from database
async function getHistoricalData(token: any, periodDays: number) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays)

    const analytics = await supabaseOperations.getTokenAnalytics(token.id, `${periodDays}d`)
    
    // Filter by date and sort chronologically
    return analytics
      .filter(data => new Date(data.timestamp) >= cutoffDate)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (error) {
    console.error("Error fetching historical data:", error)
    return []
  }
}

// Create initial analytics data point
async function createInitialAnalyticsData(token: any) {
  const currentTime = new Date()
  
  // Try to get real creator metrics from InsightIQ
  let creatorMetrics = null
  if (token.creatorUsername) {
    creatorMetrics = await insightIQ.getUserByUsername(token.creatorUsername)
  }

  return {
    token_id: token.id,
    period: "1d",
    metrics: {
      token_price: parseFloat(token.current_price || "0.01"),
      holders_count: token.holders_count || 1,
      market_cap: parseFloat(token.market_cap || "0"),
      volume_24h: 0,
      followers: creatorMetrics?.followers || 1000,
      engagement_rate: creatorMetrics?.engagementRate || 0.02,
      influence_score: creatorMetrics?.influenceScore || 50,
    },
    price_data: {
      current: parseFloat(token.current_price || "0.01"),
      change_24h: 0
    },
    volume_data: {
      volume_24h: 0
    },
    holder_data: {
      total_holders: token.holders_count || 1
    }
  }
}

// Helper functions
function getPeriodDays(period: string): number {
  switch (period) {
    case "24h": return 1
    case "7d": return 7
    case "30d": return 30
    case "90d": return 90
    default: return 30
  }
}

function calculatePerformanceScore(data: {
  followerGrowth: number
  engagementGrowth: number
  priceGrowth: number
  currentMetrics: any
}): number {
  const { followerGrowth, engagementGrowth, priceGrowth, currentMetrics } = data
  
  // Weighted performance calculation
  const growthScore = (followerGrowth * 0.3 + engagementGrowth * 0.4 + priceGrowth * 0.3)
  const metricScore = (
    Math.min(currentMetrics.followers / 10000, 1) * 20 +
    Math.min(currentMetrics.engagement_rate * 100, 1) * 30 +
    Math.min(currentMetrics.influence_score / 100, 1) * 20 +
    Math.min(currentMetrics.holders_count / 1000, 1) * 30
  )
  
  return Math.max(0, Math.min(100, growthScore + metricScore))
}

function calculateMarketCap(totalSupply: string | number, currentPrice: number): string {
  try {
    const supply = typeof totalSupply === 'string' ? parseFloat(totalSupply) : totalSupply
    const marketCap = supply * currentPrice
    return marketCap.toFixed(2)
  } catch (error) {
    return "0"
  }
}
