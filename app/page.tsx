"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WalletConnect } from "@/components/wallet-connect"
import { Zap, Shield, BarChart3, ArrowRight, CheckCircle, Globe, Rocket, Target } from "lucide-react"
import { supabaseOperations } from "@/lib/supabase"

interface Token {
  id: string
  name: string
  symbol: string
  current_price: string
  verified: boolean
  metrics: {
    followers: number
    engagement: number
    influence: number
  }
  users?: {
    display_name: string
    twitter_username: string
    profile_image: string
  }
}

export default function HomePage() {
  const [featuredTokens, setFeaturedTokens] = useState<Token[]>([])
  const [stats, setStats] = useState({
    totalTokens: 0,
    totalCreators: 0,
    totalVolume: 0,
    avgGrowth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const tokens = await supabaseOperations.getTokens(6)
      setFeaturedTokens(tokens as Token[])

      // Calculate stats from tokens
      setStats({
        totalTokens: tokens.length * 8, // Simulate more tokens
        totalCreators: tokens.length * 6, // Simulate more creators
        totalVolume: tokens.reduce((sum, token) => sum + Number.parseFloat(token.current_price || "0") * 1000, 0),
        avgGrowth: 24.5, // Mock average growth
      })
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">XMenity Tube</span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <Link href="/explore" className="text-gray-300 hover:text-white transition-colors">
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

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Turn Your
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {" "}
                Social Influence{" "}
              </span>
              Into Value
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Create milestone-based social tokens that grow with your audience. Reward your community and monetize your
              influence with XMenity Tube.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/launch">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
                >
                  Launch Your Token
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg bg-transparent"
                >
                  Explore Tokens
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalTokens}+</div>
                <div className="text-gray-400">Active Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalCreators}+</div>
                <div className="text-gray-400">Creators</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">${stats.totalVolume.toFixed(0)}K</div>
                <div className="text-gray-400">Total Volume</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.avgGrowth}%</div>
                <div className="text-gray-400">Avg Growth</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tokens */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Featured Social Tokens</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover trending tokens from top creators and influencers
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTokens.map((token) => (
                <Card
                  key={token.id}
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{token.symbol.charAt(0)}</span>
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
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Price</span>
                        <span className="text-white font-bold">${token.current_price}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <div className="text-white font-semibold">{token.metrics.followers.toLocaleString()}</div>
                          <div className="text-gray-400">Followers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-semibold">{token.metrics.engagement}%</div>
                          <div className="text-gray-400">Engagement</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-semibold">{token.metrics.influence}</div>
                          <div className="text-gray-400">Influence</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <img
                          src={token.users?.profile_image || "/placeholder-user.jpg"}
                          alt={token.users?.display_name || "Creator"}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-gray-300 text-sm">@{token.users?.twitter_username || "creator"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/explore">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                View All Tokens
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose XMenity Tube?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              The most advanced platform for creating and trading social tokens
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">Milestone-Based Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Set follower and engagement milestones that automatically unlock token rewards for your community.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Track your token performance, holder growth, and social metrics with comprehensive analytics.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-white">Verified Creators</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  InsightIQ verification ensures authentic creators with real influence and engagement.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <CardTitle className="text-white">Instant Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Deploy your social token in minutes with our streamlined creation process.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-red-400" />
                </div>
                <CardTitle className="text-white">Multi-Platform Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Connect your Twitter, Instagram, TikTok, and YouTube accounts for comprehensive metrics.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Rocket className="w-6 h-6 text-indigo-400" />
                </div>
                <CardTitle className="text-white">Community Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Built-in tools to grow your community and increase token holder engagement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Launch Your Social Token?</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of creators who are already monetizing their influence with XMenity Tube. Get verified,
                set your milestones, and start earning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/launch">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
                  >
                    Get Started Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 px-8 py-3 bg-transparent"
                  >
                    Explore Platform
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">XMenity Tube</span>
            </div>
            <div className="flex space-x-6 text-gray-400">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/support" className="hover:text-white transition-colors">
                Support
              </Link>
            </div>
          </div>
          <div className="text-center text-gray-400 mt-4 pt-4 border-t border-white/10">
            © 2024 XMenity Tube. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
