"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  Shield, 
  Target,
  BarChart3,
  ExternalLink,
  RefreshCw,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Coins
} from "lucide-react"
import { formatTokenAmount, formatPrice } from "@/lib/web3"

interface TokenData {
  id: string
  name: string
  symbol: string
  description: string
  creatorWallet: string
  creatorUsername: string
  verificationLevel: string
  currentPrice: string
  marketCap: string
  holdersCount: number
  volume24h: string
  contractAddress: string
  deployed: boolean
  logoUrl: string
  metrics: {
    followers: number
    engagement_rate: number
    authenticity_score: number
    influence_score: number
  }
  milestones: {
    completed_milestones: number
    total_milestones: number
    progress_percentage: number
  }
  performance_score?: number
  growth_metrics?: {
    follower_growth: number
    price_growth: number
  }
}

export default function ExplorePage() {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [filteredTokens, setFilteredTokens] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("performance_score")
  const [filterBy, setFilterBy] = useState("all") // all, deployed, verified
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchTokens()
  }, [])

  useEffect(() => {
    filterAndSortTokens()
  }, [tokens, searchTerm, sortBy, filterBy])

  const fetchTokens = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/tokens?verified=true&limit=50")
      const data = await response.json()
      
      if (data.success) {
        setTokens(data.tokens)
      } else {
        setError(data.error || "Failed to fetch tokens")
      }
    } catch (error) {
      console.error("Error fetching tokens:", error)
      setError("Failed to load tokens")
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchTokens()
    setRefreshing(false)
  }

  const filterAndSortTokens = () => {
    let filtered = [...tokens]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(token => 
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.creatorUsername?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    switch (filterBy) {
      case "deployed":
        filtered = filtered.filter(token => token.deployed)
        break
      case "verified":
        filtered = filtered.filter(token => 
          token.verificationLevel && token.verificationLevel !== "unverified"
        )
        break
      case "trending":
        filtered = filtered.filter(token => 
          token.growth_metrics?.follower_growth > 0 || token.growth_metrics?.price_growth > 0
        )
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "performance_score":
          return (b.performance_score || 0) - (a.performance_score || 0)
        case "market_cap":
          return parseFloat(b.marketCap || "0") - parseFloat(a.marketCap || "0")
        case "holders":
          return (b.holdersCount || 0) - (a.holdersCount || 0)
        case "volume":
          return parseFloat(b.volume24h || "0") - parseFloat(a.volume24h || "0")
        case "followers":
          return (b.metrics?.followers || 0) - (a.metrics?.followers || 0)
        case "newest":
          return new Date(b.id).getTime() - new Date(a.id).getTime()
        default:
          return 0
      }
    })

    setFilteredTokens(filtered)
  }

  const getVerificationBadgeColor = (level: string) => {
    switch (level) {
      case "elite":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "premium":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "basic":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tokens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Explore Tokens
              </h1>
              <p className="text-gray-600 mt-1">
                Discover verified creator tokens with milestone-based rewards
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={refreshData} disabled={refreshing} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/launch">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                  <Coins className="h-4 w-4 mr-2" />
                  Launch Token
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tokens, symbols, or creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Tokens</option>
              <option value="deployed">Deployed</option>
              <option value="verified">Verified</option>
              <option value="trending">Trending</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="performance_score">Performance Score</option>
              <option value="market_cap">Market Cap</option>
              <option value="holders">Holders</option>
              <option value="volume">Volume</option>
              <option value="followers">Followers</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tokens</p>
                  <p className="text-2xl font-bold">{tokens.length}</p>
                </div>
                <Coins className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Deployed</p>
                  <p className="text-2xl font-bold">
                    {tokens.filter(t => t.deployed).length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Market Cap</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(
                      tokens.reduce((sum, t) => sum + parseFloat(t.marketCap || "0"), 0)
                    )}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Holders</p>
                  <p className="text-2xl font-bold">
                    {tokens.reduce((sum, t) => sum + (t.holdersCount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tokens Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTokens.map((token) => (
            <Card key={token.id} className="hover:shadow-lg transition-shadow duration-200 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                      {token.logoUrl ? (
                        <img 
                          src={token.logoUrl} 
                          alt={token.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        token.symbol.slice(0, 2)
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                        {token.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{token.symbol}</Badge>
                        {token.verificationLevel && token.verificationLevel !== "unverified" && (
                          <Badge className={getVerificationBadgeColor(token.verificationLevel)}>
                            {token.verificationLevel}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {token.deployed && (
                    <Shield className="h-5 w-5 text-green-600" />
                  )}
                </div>

                {/* Creator Info */}
                {token.creatorUsername && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>by @{token.creatorUsername}</span>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{token.metrics?.followers?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Performance Score */}
                {token.performance_score !== undefined && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Performance Score</span>
                      <span className={`font-semibold ${getPerformanceColor(token.performance_score)}`}>
                        {token.performance_score}/100
                      </span>
                    </div>
                    <Progress value={token.performance_score} className="h-2" />
                  </div>
                )}

                {/* Token Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 block">Price</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold">{formatPrice(token.currentPrice)}</span>
                      {token.growth_metrics?.price_growth !== undefined && (
                        <div className={`flex items-center ${token.growth_metrics.price_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {token.growth_metrics.price_growth >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          <span className="text-xs">{Math.abs(token.growth_metrics.price_growth).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 block">Market Cap</span>
                    <span className="font-semibold">{formatPrice(token.marketCap)}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 block">Holders</span>
                    <span className="font-semibold">{token.holdersCount?.toLocaleString() || 0}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 block">24h Volume</span>
                    <span className="font-semibold">{formatPrice(token.volume24h)}</span>
                  </div>
                </div>

                {/* Milestone Progress */}
                {token.milestones && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>Milestones</span>
                      </div>
                      <span className="text-gray-500">
                        {token.milestones.completed_milestones}/{token.milestones.total_milestones}
                      </span>
                    </div>
                    <Progress value={token.milestones.progress_percentage} className="h-2" />
                  </div>
                )}

                {/* Metrics */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>{token.metrics?.engagement_rate?.toFixed(1)}% engagement</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>{token.metrics?.authenticity_score}/100 authentic</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  {token.deployed && token.contractAddress && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://arbiscan.io/address/${token.contractAddress}`, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTokens.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tokens found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `No tokens match "${searchTerm}". Try a different search term.`
                : "No tokens match your current filters. Try adjusting your filters."
              }
            </p>
            <Button onClick={() => { setSearchTerm(""); setFilterBy("all"); }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Pagination would go here in a real app */}
        {filteredTokens.length > 0 && (
          <div className="text-center mt-8 text-gray-600">
            Showing {filteredTokens.length} of {tokens.length} tokens
          </div>
        )}
      </main>
    </div>
  )
}
