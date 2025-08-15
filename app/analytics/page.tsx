"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  BarChart3, 
  Target,
  Trophy,
  Activity,
  Eye,
  Heart,
  MessageCircle,
  Share
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface AnalyticsData {
  performance: {
    score: number
    trend: "bullish" | "bearish" | "stable"
    change: number
  }
  growth: {
    followers: number
    engagement: number
    price: number
  }
  metrics: {
    totalSupply: string
    holdersCount: number
    marketCap: string
    currentPrice: string
  }
  historical: Array<{
    timestamp: string
    token_price: number
    holders_count: number
    followers: number
    engagement_rate: number
    volume_24h: number
  }>
}

interface TokenData {
  id: string
  name: string
  symbol: string
  description: string
  logoUrl?: string
  contractAddress: string
  tier: string
  tokenomics: {
    milestones: Array<{
      holders: number
      reward: number
      unlocked: boolean
      index: number
      description: string
    }>
  }
  currentMilestone: number
  nextMilestoneTarget: number
  milestonesAchieved: number[]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const contractAddress = searchParams.get("contract")
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [token, setToken] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("30d")

  useEffect(() => {
    if (contractAddress) {
      fetchAnalytics()
    }
  }, [contractAddress, selectedPeriod])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/analytics?contractAddress=${contractAddress}&period=${selectedPeriod}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch analytics")
      }

      const data = await response.json()
      setAnalytics(data.analytics)
      setToken(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!contractAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>
              Please provide a contract address to view analytics
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error || !analytics || !token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || "Failed to load analytics data"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchAnalytics}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "bullish":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "bearish":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (value: number) => {
    return value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : "text-gray-500"
  }

  const nextMilestone = token.tokenomics.milestones.find(m => !m.unlocked)
  const progress = nextMilestone ? 
    (analytics.metrics.holdersCount / nextMilestone.holders) * 100 : 100

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {token.logoUrl && (
            <img 
              src={token.logoUrl} 
              alt={token.name}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{token.name} Analytics</h1>
            <p className="text-gray-600">
              {token.symbol} • {token.tier} tier • {token.contractAddress.slice(0, 8)}...
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {["24h", "7d", "30d", "90d"].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.performance.score}/100</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(analytics.performance.trend)}
              <span className={`ml-1 ${getTrendColor(analytics.performance.change)}`}>
                {analytics.performance.change > 0 ? "+" : ""}{analytics.performance.change}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.metrics.currentPrice}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className={getTrendColor(analytics.growth.price)}>
                {analytics.growth.price > 0 ? "+" : ""}{analytics.growth.price}%
              </span>
              <span className="ml-1">vs {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Holders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.metrics.holdersCount.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className={getTrendColor(analytics.growth.followers)}>
                {analytics.growth.followers > 0 ? "+" : ""}{analytics.growth.followers}%
              </span>
              <span className="ml-1">growth</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${parseFloat(analytics.metrics.marketCap).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {analytics.metrics.totalSupply} total supply
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="growth">Growth Metrics</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Next Milestone Progress */}
          {nextMilestone && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Next Milestone Progress</span>
                </CardTitle>
                <CardDescription>{nextMilestone.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {analytics.metrics.holdersCount} / {nextMilestone.holders} holders
                  </span>
                  <Badge variant="outline">
                    {(nextMilestone.reward * 100).toFixed(1)}% reward
                  </Badge>
                </div>
                <Progress value={Math.min(progress, 100)} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {nextMilestone.holders - analytics.metrics.holdersCount} more holders needed
                </p>
              </CardContent>
            </Card>
          )}

          {/* Historical Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Price & Volume History</CardTitle>
              <CardDescription>Token performance over {selectedPeriod}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Chart visualization would go here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Milestone Achievements</span>
              </CardTitle>
              <CardDescription>
                Track progress through holder milestones and unlock rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {token.tokenomics.milestones.map((milestone, index) => {
                  const isAchieved = milestone.unlocked || analytics.metrics.holdersCount >= milestone.holders
                  const isCurrent = !milestone.unlocked && analytics.metrics.holdersCount < milestone.holders && 
                    (index === 0 || analytics.metrics.holdersCount >= token.tokenomics.milestones[index - 1].holders)
                  
                  return (
                    <div
                      key={milestone.index}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isAchieved ? 'bg-green-50 border-green-200' : 
                        isCurrent ? 'bg-blue-50 border-blue-200' : 
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isAchieved ? 'bg-green-500 text-white' : 
                          isCurrent ? 'bg-blue-500 text-white' : 
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {isAchieved ? '✓' : milestone.index}
                        </div>
                        <div>
                          <p className="font-medium">{milestone.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {milestone.holders.toLocaleString()} holders required
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={isAchieved ? "default" : "outline"}>
                          {(milestone.reward * 100).toFixed(1)}% reward
                        </Badge>
                        {isCurrent && (
                          <p className="text-xs text-blue-600 mt-1">
                            {((analytics.metrics.holdersCount / milestone.holders) * 100).toFixed(1)}% complete
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Follower Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {analytics.historical[0]?.followers?.toLocaleString() || 'N/A'}
                </div>
                <div className={`flex items-center ${getTrendColor(analytics.growth.followers)}`}>
                  <span>{analytics.growth.followers > 0 ? "+" : ""}{analytics.growth.followers}%</span>
                  <span className="ml-1 text-muted-foreground">vs {selectedPeriod}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {((analytics.historical[0]?.engagement_rate || 0) * 100).toFixed(2)}%
                </div>
                <div className={`flex items-center ${getTrendColor(analytics.growth.engagement)}`}>
                  <span>{analytics.growth.engagement > 0 ? "+" : ""}{analytics.growth.engagement}%</span>
                  <span className="ml-1 text-muted-foreground">vs {selectedPeriod}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">24h Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  ${(analytics.historical[0]?.volume_24h || 0).toLocaleString()}
                </div>
                <div className="text-muted-foreground">
                  Trading volume
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Reach & Impressions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reach</p>
                    <p className="text-2xl font-bold">
                      {(analytics.historical[0]?.followers * 0.3 || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Impressions</p>
                    <p className="text-2xl font-bold">
                      {(analytics.historical[0]?.followers * 0.15 || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span>Engagement Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Likes</span>
                    <span className="font-bold">
                      {(analytics.historical[0]?.followers * analytics.historical[0]?.engagement_rate * 0.7 || 0).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Comments</span>
                    <span className="font-bold">
                      {(analytics.historical[0]?.followers * analytics.historical[0]?.engagement_rate * 0.2 || 0).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Shares</span>
                    <span className="font-bold">
                      {(analytics.historical[0]?.followers * analytics.historical[0]?.engagement_rate * 0.1 || 0).toFixed(0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
