"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { WalletConnect } from "@/components/wallet-connect"
import {
  Rocket,
  TrendingUp,
  Users,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle,
  Twitter,
  BarChart3,
  Coins,
} from "lucide-react"

interface User {
  id: string
  walletAddress: string
  displayName?: string
  isVerified: boolean
  twitterUsername?: string
  profileImage?: string
}

interface FeaturedToken {
  id: string
  name: string
  symbol: string
  description: string
  creator: string
  price: string
  change24h: string
  marketCap: string
  holders: number
  logo?: string
}

const featuredTokens: FeaturedToken[] = [
  {
    id: "1",
    name: "CreatorCoin",
    symbol: "CREATE",
    description: "Token for content creators and their communities",
    creator: "@creator_pro",
    price: "$0.45",
    change24h: "+12.5%",
    marketCap: "$2.1M",
    holders: 1250,
    logo: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "2",
    name: "StreamToken",
    symbol: "STREAM",
    description: "Rewarding live streamers and their audiences",
    creator: "@stream_king",
    price: "$0.78",
    change24h: "+8.3%",
    marketCap: "$5.4M",
    holders: 2100,
    logo: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "3",
    name: "InfluenceCoin",
    symbol: "INFL",
    description: "Social influence meets tokenized rewards",
    creator: "@influence_hub",
    price: "$1.23",
    change24h: "-2.1%",
    marketCap: "$8.7M",
    holders: 3400,
    logo: "/placeholder.svg?height=40&width=40",
  },
]

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const handleAuthenticated = (userData: User, authToken: string) => {
    setUser(userData)
    setToken(authToken)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  XMenity
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/explore"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Explore
              </Link>
              <Link
                href="/launch"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Launch Token
              </Link>
              <Link
                href="/test-token"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Test Suite
              </Link>
            </div>

            <WalletConnect onAuthenticated={handleAuthenticated} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Launch Your{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Social Token
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Create milestone-based community tokens on Arbitrum. Reward your followers, monetize your content, and
              build a thriving token economy around your brand.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/launch">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Launch Your Token
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg" className="px-8 py-3 bg-transparent">
                  <Globe className="mr-2 h-5 w-5" />
                  Explore Tokens
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
                <div className="text-gray-600 dark:text-gray-300">Tokens Launched</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">$2.5M</div>
                <div className="text-gray-600 dark:text-gray-300">Total Volume</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">10K+</div>
                <div className="text-gray-600 dark:text-gray-300">Community Members</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose XMenity?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built for creators, by creators. Our platform combines the power of Web3 with the simplicity your audience
              expects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>InsightIQ Verified</CardTitle>
                <CardDescription>
                  Authentic creator verification through InsightIQ integration ensures trust and credibility.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Milestone-Based</CardTitle>
                <CardDescription>
                  Set custom metrics and thresholds. Tokens unlock value as you hit your goals.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Arbitrum Powered</CardTitle>
                <CardDescription>
                  Fast, cheap transactions on Arbitrum. Your community won't pay high gas fees.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Community First</CardTitle>
                <CardDescription>
                  Built-in governance and community features. Let your holders shape the future.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle>Real-Time Analytics</CardTitle>
                <CardDescription>
                  Track your token's performance with comprehensive analytics and insights.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <Twitter className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Social Integration</CardTitle>
                <CardDescription>Seamless Twitter integration for verification and community building.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Tokens */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Featured Tokens</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Discover trending creator tokens and their communities
              </p>
            </div>
            <Link href="/explore">
              <Button variant="outline" className="hidden md:flex bg-transparent">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTokens.map((token) => (
              <Card key={token.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={token.logo || "/placeholder.svg"} alt={token.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <CardTitle className="text-lg">{token.name}</CardTitle>
                        <CardDescription className="text-sm">{token.symbol}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{token.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Creator:</span>
                    <span className="font-medium text-blue-600">{token.creator}</span>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Price</div>
                      <div className="font-semibold">{token.price}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">24h Change</div>
                      <div
                        className={`font-semibold ${
                          token.change24h.startsWith("+") ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {token.change24h}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Market Cap</div>
                      <div className="font-semibold">{token.marketCap}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Holders</div>
                      <div className="font-semibold">{token.holders.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link href="/explore">
              <Button variant="outline">
                View All Tokens
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Launch your social token in minutes with our simple, powerful platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Connect & Verify</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect your wallet and verify your Twitter account through InsightIQ integration
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Configure Token</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Set your token details, milestones, and custom metrics that matter to your community
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Launch & Grow</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Deploy your token on Arbitrum and start building your tokenized community
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Launch Your Token?</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join the creator economy revolution. Build your community, reward your fans, and monetize your content with
            social tokens.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/launch">
              <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3">
                <Rocket className="mr-2 h-5 w-5" />
                Launch Your Token
              </Button>
            </Link>
            <Link href="/test-token">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-3 bg-transparent"
              >
                <Coins className="mr-2 h-5 w-5" />
                Try Test Suite
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">XMenity</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The premier platform for launching social tokens on Arbitrum. Built for creators, powered by community.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                  <Twitter className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/launch" className="hover:text-white transition-colors">
                    Launch Token
                  </Link>
                </li>
                <li>
                  <Link href="/explore" className="hover:text-white transition-colors">
                    Explore
                  </Link>
                </li>
                <li>
                  <Link href="/test-token" className="hover:text-white transition-colors">
                    Test Suite
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-gray-800" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 XMenity. All rights reserved.</p>
            <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
