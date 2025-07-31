"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Search, Users, Coins, ArrowRight, Shield, Target, Sparkles, SortAsc, SortDesc } from "lucide-react"
import Link from "next/link"
import { WalletConnect } from "@/components/wallet-connect"

interface Token {
  id: string
  name: string
  symbol: string
  description: string
  logoUrl: string
  totalSupply: string
  creatorWallet: string
  metrics: string[]
  thresholds: number[]
  weights: number[]
  currentPrice: string
  marketCap: string
  holdersCount: number
  createdAt: Date
  deployed: boolean
  contractAddress?: string
}

export default function ExplorePage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [filterBy, setFilterBy] = useState("all")

  useEffect(() => {
    fetchTokens()
  }, [])

  useEffect(() => {
    filterAndSortTokens()
  }, [tokens, searchQuery, sortBy, filterBy])

  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/tokens?limit=50")
      const data = await response.json()

      if (data.success) {
        setTokens(data.tokens)
      } else {
        // Mock data for demonstration
        const mockTokens: Token[] = [
          {
            id: "1",
            name: "CreatorCoin Alpha",
            symbol: "CCA",
            description: "The first social token for tech content creators with custom engagement metrics",
            logoUrl: "/placeholder.svg?height=64&width=64",
            totalSupply: "1000000",
            creatorWallet: "0x1234...5678",
            metrics: ["followers", "likes", "engagement"],
            thresholds: [100000, 500000, 1000000],
            weights: [30, 40, 30],
            currentPrice: "0.05",
            marketCap: "50000",
            holdersCount: 1250,
            createdAt: new Date(Date.now() - 86400000 * 7),
            deployed: true,
            contractAddress: "0xabc123...",
          },
          {
            id: "2",
            name: "ArtistToken Beta",
            symbol: "ATB",
            description: "Supporting digital artists with milestone-based rewards and custom metrics",
            logoUrl: "/placeholder.svg?height=64&width=64",
            totalSupply: "500000",
            creatorWallet: "0x5678...9012",
            metrics: ["followers", "views", "shares"],
            thresholds: [50000, 100000, 250000],
            weights: [25, 50, 25],
            currentPrice: "0.12",
            marketCap: "60000",
            holdersCount: 890,
            createdAt: new Date(Date.now() - 86400000 * 3),
            deployed: true,
            contractAddress: "0xdef456...",
          },
          {
            id: "3",
            name: "GameStreamer Token",
            symbol: "GST",
            description: "Token for gaming streamers with viewer and engagement milestones",
            logoUrl: "/placeholder.svg?height=64&width=64",
            totalSupply: "2000000",
            creatorWallet: "0x9012...3456",
            metrics: ["followers", "viewers", "hours_streamed"],
            thresholds: [25000, 75000, 150000],
            weights: [40, 35, 25],
            currentPrice: "0.03",
            marketCap: "60000",
            holdersCount: 2100,
            createdAt: new Date(Date.now() - 86400000 * 1),
            deployed: true,
            contractAddress: "0x789abc...",
          },
        ]
        setTokens(mockTokens)
      }
    } catch (error) {
      console.error("Failed to fetch tokens:", error)
    } finally {
      setIsLoading(false)
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
          token.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply category filter
    if (filterBy !== "all") {
      switch (filterBy) {
        case "deployed":
          filtered = filtered.filter((token) => token.deployed)
          break
        case "high-supply":
          filtered = filtered.filter((token) => Number.parseInt(token.totalSupply) > 1000000)
          break
        case "verified":
          filtered = filtered.filter((token) => token.contractAddress)
          break
      }
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case "price-high":
        filtered.sort((a, b) => Number.parseFloat(b.currentPrice) - Number.parseFloat(a.currentPrice))
        break
      case "price-low":
        filtered.sort((a, b) => Number.parseFloat(a.currentPrice) - Number.parseFloat(b.currentPrice))
        break
      case "holders":
        filtered.sort((a, b) => b.holdersCount - a.holdersCount)
        break
    }

    setFilteredTokens(filtered)
  }

  const TokenCard = ({ token }: { token: Token }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={token.logoUrl || "/placeholder.svg"} alt={token.name} />
              <AvatarFallback>{token.symbol.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{token.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <span>${token.symbol}</span>
                {token.deployed && <Shield className="h-4 w-4 text-green-500" />}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary">${token.currentPrice}</Badge>
            <div className="text-xs text-muted-foreground mt-1">${token.marketCap} cap</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{token.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{token.holdersCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Coins className="h-4 w-4" />
            <span>{Number(token.totalSupply).toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center">
              <Target className="h-4 w-4 mr-1" />
              Custom Metrics
            </span>
            <span>{token.metrics.length} metrics</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {token.metrics.slice(0, 3).map((metric, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {metric}
              </Badge>
            ))}
            {token.metrics.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{token.metrics.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Next Milestone Progress</span>
            <span>65%</span>
          </div>
          <Progress value={65} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">Created {new Date(token.createdAt).toLocaleDateString()}</div>
          <Button size="sm" variant="outline">
            View Details
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold">Explore Tokens</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-purple-600">
              Home
            </Link>
            <Link href="/launch" className="text-gray-600 hover:text-purple-600">
              Launch
            </Link>
            <Link href="/test-token" className="text-gray-600 hover:text-purple-600">
              Test
            </Link>
          </nav>
          <WalletConnect />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tokens by name, symbol, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center">
                      <SortDesc className="mr-2 h-4 w-4" />
                      Newest
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center">
                      <SortAsc className="mr-2 h-4 w-4" />
                      Oldest
                    </div>
                  </SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="holders">Most Holders</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tokens</SelectItem>
                  <SelectItem value="deployed">Deployed Only</SelectItem>
                  <SelectItem value="high-supply">High Supply</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{filteredTokens.length}</div>
                <div className="text-sm text-gray-600">Tokens Found</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredTokens.filter((t) => t.deployed).length}
                </div>
                <div className="text-sm text-gray-600">Deployed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredTokens.reduce((sum, t) => sum + t.holdersCount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Holders</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(filteredTokens.flatMap((t) => t.metrics)).size}
                </div>
                <div className="text-sm text-gray-600">Unique Metrics</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tokens Grid */}
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTokens.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTokens.map((token) => (
                  <TokenCard key={token.id} token={token} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tokens Found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery
                      ? `No tokens match "${searchQuery}". Try adjusting your search or filters.`
                      : "No tokens available yet. Be the first to create one!"}
                  </p>
                  <Link href="/launch">
                    <Button>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Launch First Token
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-4">
              {filteredTokens.map((token) => (
                <Card key={token.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={token.logoUrl || "/placeholder.svg"} alt={token.name} />
                          <AvatarFallback>{token.symbol.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{token.name}</h3>
                          <p className="text-sm text-gray-600">${token.symbol}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">${token.currentPrice}</div>
                          <div className="text-gray-500">Price</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{token.holdersCount}</div>
                          <div className="text-gray-500">Holders</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{token.metrics.length}</div>
                          <div className="text-gray-500">Metrics</div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
