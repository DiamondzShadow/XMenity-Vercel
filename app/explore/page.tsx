"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WalletConnect } from "@/components/wallet-connect"
import { Search, Filter, Zap, CheckCircle, Grid3X3, List, ArrowUpDown, Eye } from "lucide-react"
import { supabaseOperations } from "@/lib/supabase"

interface Token {
  id: string
  name: string
  symbol: string
  description: string
  contract_address: string
  total_supply: string
  current_price: string
  creator_wallet: string
  verified: boolean
  logo_url?: string
  metrics: {
    followers: number
    engagement: number
    influence: number
    posts: number
  }
  milestones: Array<{
    target: number
    current: number
    label: string
    completed: boolean
  }>
  created_at: string
  users?: {
    display_name: string
    twitter_username: string
    profile_image: string
  }
}

export default function ExplorePage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [filterBy, setFilterBy] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    fetchTokens()
  }, [])

  useEffect(() => {
    filterAndSortTokens()
  }, [tokens, searchQuery, sortBy, filterBy])

  const fetchTokens = async () => {
    try {
      setLoading(true)
      const data = await supabaseOperations.getTokens(50)
      setTokens(data as Token[])
    } catch (error) {
      console.error("Error fetching tokens:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortTokens = () => {
    let filtered = [...tokens]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (token) =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.users?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply verification filter
    if (filterBy === "verified") {
      filtered = filtered.filter((token) => token.verified)
    } else if (filterBy === "unverified") {
      filtered = filtered.filter((token) => !token.verified)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price_high":
          return Number.parseFloat(b.current_price) - Number.parseFloat(a.current_price)
        case "price_low":
          return Number.parseFloat(a.current_price) - Number.parseFloat(b.current_price)
        case "followers":
          return b.metrics.followers - a.metrics.followers
        case "engagement":
          return b.metrics.engagement - a.metrics.engagement
        case "influence":
          return b.metrics.influence - a.metrics.influence
        case "created_at":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredTokens(filtered)
  }

  const TokenCard = ({ token }: { token: Token }) => (
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              {token.logo_url ? (
                <img src={token.logo_url || "/placeholder.svg"} alt={token.name} className="w-12 h-12 rounded-full" />
              ) : (
                <span className="text-white font-bold">{token.symbol.charAt(0)}</span>
              )}
            </div>
            <div>
              <CardTitle className="text-white text-lg">{token.name}</CardTitle>
              <CardDescription className="text-gray-400">${token.symbol}</CardDescription>
            </div>
          </div>
          {token.verified && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm line-clamp-2">{token.description}</p>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Price</span>
            <span className="text-white font-bold">${token.current_price}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Followers</span>
                <span className="text-white">{token.metrics.followers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Engagement</span>
                <span className="text-white">{token.metrics.engagement}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Influence</span>
                <span className="text-white">{token.metrics.influence}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Posts</span>
                <span className="text-white">{token.metrics.posts}</span>
              </div>
            </div>
          </div>

          {/* Milestone Progress */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Next Milestone Progress</div>
            {token.milestones
              .map((milestone, index) => {
                if (milestone.completed) return null
                const progress = (milestone.current / milestone.target) * 100
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">{milestone.label}</span>
                      <span className="text-white">
                        {milestone.current}/{milestone.target}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })
              .slice(0, 1)}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <img
                src={token.users?.profile_image || "/placeholder-user.jpg"}
                alt={token.users?.display_name || "Creator"}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-gray-300 text-sm">@{token.users?.twitter_username || "creator"}</span>
            </div>
            <Link href={`/analytics?contract=${token.contract_address}`}>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TokenListItem = ({ token }: { token: Token }) => (
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              {token.logo_url ? (
                <img src={token.logo_url || "/placeholder.svg"} alt={token.name} className="w-12 h-12 rounded-full" />
              ) : (
                <span className="text-white font-bold">{token.symbol.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-semibold">{token.name}</h3>
                <span className="text-gray-400">${token.symbol}</span>
                {token.verified && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <CheckCircle className="w-2 h-2 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-gray-300 text-sm">{token.description}</p>
              <div className="flex items-center space-x-2 mt-1">
                <img
                  src={token.users?.profile_image || "/placeholder-user.jpg"}
                  alt={token.users?.display_name || "Creator"}
                  className="w-4 h-4 rounded-full"
                />
                <span className="text-gray-400 text-xs">@{token.users?.twitter_username || "creator"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className="text-white font-semibold">${token.current_price}</div>
              <div className="text-gray-400 text-xs">Price</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold">{token.metrics.followers.toLocaleString()}</div>
              <div className="text-gray-400 text-xs">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold">{token.metrics.engagement}%</div>
              <div className="text-gray-400 text-xs">Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold">{token.metrics.influence}</div>
              <div className="text-gray-400 text-xs">Influence</div>
            </div>
            <Link href={`/analytics?contract=${token.contract_address}`}>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">XMenity Tube</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <Link href="/explore" className="text-white font-medium">
                Explore
              </Link>
              <Link href="/launch" className="text-gray-300 hover:text-white transition-colors">
                Launch Token
              </Link>
              <Link href="/analytics" className="text-gray-300 hover:text-white transition-colors">
                Analytics
              </Link>
            </div>

            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Explore Social Tokens</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover and invest in tokens from verified creators and influencers
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-8">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tokens, creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
              </div>

              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tokens</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Newest</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="followers">Most Followers</SelectItem>
                  <SelectItem value="engagement">Highest Engagement</SelectItem>
                  <SelectItem value="influence">Most Influential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="border-white/20"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="border-white/20"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-400">
              Showing {filteredTokens.length} token{filteredTokens.length !== 1 ? "s" : ""}
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>

          {/* Tokens Grid/List */}
          {loading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-white/10 rounded mb-4"></div>
                    <div className="h-4 bg-white/10 rounded mb-2"></div>
                    <div className="h-4 bg-white/10 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">No tokens found</h3>
                <p className="text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
                <Button
                  onClick={() => {
                    setSearchQuery("")
                    setFilterBy("all")
                    setSortBy("created_at")
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredTokens.map((token) =>
                viewMode === "grid" ? (
                  <TokenCard key={token.id} token={token} />
                ) : (
                  <TokenListItem key={token.id} token={token} />
                ),
              )}
            </div>
          )}

          {/* Load More */}
          {!loading && filteredTokens.length > 0 && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                onClick={fetchTokens}
              >
                Load More Tokens
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
