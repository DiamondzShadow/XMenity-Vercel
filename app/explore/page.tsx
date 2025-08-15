"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Shield, 
  Star, 
  Target,
  Activity,
  Clock,
  DollarSign,
  BarChart3,
  ExternalLink,
  Eye
} from "lucide-react"
import Link from "next/link"

interface Token {
  id: string
  name: string
  symbol: string
  description: string
  logoUrl?: string
  contractAddress: string
  creatorUsername: string
  creatorId: string
  tier: string
  verified: boolean
  insightiqVerified: boolean
  currentPrice: string
  totalSupply: string
  holdersCount: number
  marketCap: string
  volume24h: string
  priceChange24h: number
  tokenomics: {
    milestones: Array<{
      holders: number
      reward: number
      unlocked: boolean
    }>
  }
  currentMilestone: number
  nextMilestoneTarget: number
  launchDate: string
  performanceScore: number
}

export default function ExplorePage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [sortBy, setSortBy] = useState("performance")

  useEffect(() => {
    fetchTokens()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tokens, searchTerm, selectedFilter, sortBy])

  const fetchTokens = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/tokens?limit=50")
      const data = await response.json()
      
      if (data.success) {
        // Transform data to match our interface
        const transformedTokens = data.tokens.map((token: any) => ({
          ...token,
          priceChange24h: Math.random() * 20 - 10, // Mock price change
          performanceScore: Math.floor(Math.random() * 100), // Mock performance score
        }))
        setTokens(transformedTokens)
      }
    } catch (error) {
      console.error("Failed to fetch tokens:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...tokens]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(token => 
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.creatorUsername.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    switch (selectedFilter) {
      case "verified":
        filtered = filtered.filter(token => token.insightiqVerified)
        break
      case "trending":
        filtered = filtered.filter(token => token.priceChange24h > 5)
        break
      case "new":
        filtered = filtered.filter(token => {
          const launchDate = new Date(token.launchDate)
          const daysSinceLaunch = (Date.now() - launchDate.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceLaunch <= 7
        })
        break
      case "high-performance":
        filtered = filtered.filter(token => token.performanceScore >= 70)
        break
    }

    // Sort
    switch (sortBy) {
      case "performance":
        filtered.sort((a, b) => b.performanceScore - a.performanceScore)
        break
      case "price":
        filtered.sort((a, b) => parseFloat(b.currentPrice) - parseFloat(a.currentPrice))
        break
      case "holders":
        filtered.sort((a, b) => b.holdersCount - a.holdersCount)
        break
      case "marketcap":
        filtered.sort((a, b) => parseFloat(b.marketCap) - parseFloat(a.marketCap))
        break
      case "newest":
        filtered.sort((a, b) => new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime())
        break
    }

    setFilteredTokens(filtered)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "mega": return "bg-purple-100 text-purple-800 border-purple-200"
      case "macro": return "bg-blue-100 text-blue-800 border-blue-200"
      case "micro": return "bg-green-100 text-green-800 border-green-200"
      case "nano": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getTrendIcon = (change: number) => {
    return change > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Discover Social Tokens
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Explore verified creator tokens with milestone-based rewards and real-time analytics
          </p>
          
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>{tokens.filter(t => t.insightiqVerified).length} Verified</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>{tokens.filter(t => t.priceChange24h > 0).length} Trending</span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4 text-purple-500" />
              <span>{tokens.length} Total Tokens</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tokens, creators, or symbols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white"
              >
                <option value="all">All Tokens</option>
                <option value="verified">Verified Only</option>
                <option value="trending">Trending</option>
                <option value="new">New Launches</option>
                <option value="high-performance">High Performance</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white"
              >
                <option value="performance">Performance</option>
                <option value="price">Price</option>
                <option value="holders">Holders</option>
                <option value="marketcap">Market Cap</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Featured Sections */}
        <Tabs defaultValue="all" className="max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Tokens</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="milestones">Near Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTokens.map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="verified" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTokens.filter(t => t.insightiqVerified).map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTokens.filter(t => t.priceChange24h > 5).map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTokens.filter(t => {
                const nextMilestone = t.tokenomics.milestones.find(m => !m.unlocked)
                return nextMilestone && t.holdersCount >= nextMilestone.holders * 0.8
              }).map((token) => (
                <TokenCard key={token.id} token={token} showMilestoneProgress />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {filteredTokens.length === 0 && !loading && (
          <div className="text-center py-12">
            <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No tokens found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TokenCard({ token, showMilestoneProgress = false }: { token: Token; showMilestoneProgress?: boolean }) {
  const nextMilestone = token.tokenomics.milestones.find(m => !m.unlocked)
  const milestoneProgress = nextMilestone ? (token.holdersCount / nextMilestone.holders) * 100 : 100

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {token.logoUrl ? (
              <img src={token.logoUrl} alt={token.name} className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {token.symbol.slice(0, 2)}
              </div>
            )}
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>{token.name}</span>
                {token.insightiqVerified && <Shield className="h-4 w-4 text-blue-500" />}
              </CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <span>${token.symbol}</span>
                <Badge variant="outline" className={getTierColor(token.tier)}>
                  {token.tier}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">${token.currentPrice}</p>
            <div className="flex items-center text-sm">
              {getTrendIcon(token.priceChange24h)}
              <span className={token.priceChange24h > 0 ? "text-green-600" : "text-red-600"}>
                {token.priceChange24h > 0 ? "+" : ""}{token.priceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">{token.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Holders</p>
            <p className="font-semibold">{token.holdersCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Market Cap</p>
            <p className="font-semibold">${parseFloat(token.marketCap).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Performance</span>
          </div>
          <span className={`font-semibold ${getPerformanceColor(token.performanceScore)}`}>
            {token.performanceScore}/100
          </span>
        </div>

        {showMilestoneProgress && nextMilestone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Next Milestone</span>
              <span className="text-gray-700">{nextMilestone.holders.toLocaleString()} holders</span>
            </div>
            <Progress value={Math.min(milestoneProgress, 100)} className="h-2" />
            <p className="text-xs text-gray-500">
              {(nextMilestone.reward * 100).toFixed(1)}% reward when reached
            </p>
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Link href={`/analytics?contract=${token.contractAddress}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </Link>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => window.open(`https://arbiscan.io/address/${token.contractAddress}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <span>@{token.creatorUsername}</span>
          <span>{new Date(token.launchDate).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
