import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, TrendingUp, Users, Zap } from "lucide-react"
import Link from "next/link"

export default function ExplorePage() {
  const tokens = [
    {
      name: "CreatorCoin",
      symbol: "CC",
      creator: "@techcreator",
      followers: "125K",
      price: "0.045 ETH",
      change: "+12.5%",
      marketCap: "2.1M",
      verified: true,
    },
    {
      name: "ArtistToken",
      symbol: "ART",
      creator: "@digitalartist",
      followers: "89K",
      price: "0.032 ETH",
      change: "+8.2%",
      marketCap: "1.8M",
      verified: true,
    },
    {
      name: "GameToken",
      symbol: "GAME",
      creator: "@gamingpro",
      followers: "67K",
      price: "0.028 ETH",
      change: "-2.1%",
      marketCap: "1.2M",
      verified: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-purple-600">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <Button className="bg-purple-600 hover:bg-purple-700">Launch Token</Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Explore Social Tokens</h1>
            <p className="text-gray-600">Discover and invest in creator tokens</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search tokens or creators..." className="pl-10" />
            </div>
          </div>

          {/* Token Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{token.name}</CardTitle>
                        <CardDescription>{token.creator}</CardDescription>
                      </div>
                    </div>
                    {token.verified && <Badge className="bg-blue-100 text-blue-700">Verified</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price</span>
                      <div className="text-right">
                        <div className="font-semibold">{token.price}</div>
                        <div className={`text-sm ${token.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                          {token.change}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Followers
                      </span>
                      <span className="font-semibold">{token.followers}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Market Cap</span>
                      <span className="font-semibold">${token.marketCap}</span>
                    </div>

                    <Button className="w-full mt-4">
                      <Zap className="mr-2 h-4 w-4" />
                      Buy Token
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trending Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <TrendingUp className="mr-2 h-6 w-6 text-green-600" />
              Trending Tokens
            </h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <div className="grid grid-cols-5 gap-4 text-sm font-semibold text-gray-600">
                  <span>Token</span>
                  <span>Creator</span>
                  <span>Price</span>
                  <span>24h Change</span>
                  <span>Market Cap</span>
                </div>
              </div>
              {tokens.map((token, index) => (
                <div key={index} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                  <div className="grid grid-cols-5 gap-4 items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold">{token.name}</div>
                        <div className="text-sm text-gray-500">{token.symbol}</div>
                      </div>
                    </div>
                    <span className="text-sm">{token.creator}</span>
                    <span className="font-semibold">{token.price}</span>
                    <span
                      className={`font-semibold ${token.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                    >
                      {token.change}
                    </span>
                    <span className="font-semibold">${token.marketCap}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
