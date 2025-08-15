"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Rocket, TrendingUp, Shield, Users, Zap, Star, ArrowRight, Twitter, BarChart3, Coins } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  const featuredTokens = [
    {
      id: "1",
      name: "CreatorCoin",
      symbol: "CREATE",
      creator: "@creator_name",
      price: "$0.45",
      change: "+12.5%",
      holders: "1.2K",
      volume: "$45.2K",
      image: "/placeholder.svg?height=40&width=40&text=CC",
    },
    {
      id: "2",
      name: "StreamToken",
      symbol: "STREAM",
      creator: "@streamer_pro",
      price: "$0.78",
      change: "+8.3%",
      holders: "856",
      volume: "$32.1K",
      image: "/placeholder.svg?height=40&width=40&text=ST",
    },
    {
      id: "3",
      name: "InfluenceCoin",
      symbol: "INFL",
      creator: "@influence_hub",
      price: "$1.23",
      change: "+15.7%",
      holders: "2.1K",
      volume: "$67.8K",
      image: "/placeholder.svg?height=40&width=40&text=IC",
    },
  ]

  const features = [
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "Easy Token Launch",
      description: "Launch your social token in minutes with our intuitive interface",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "InsightIQ Verified",
      description: "All creators are verified through InsightIQ for authenticity",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Milestone-Based",
      description: "Token supply adjusts based on your social media milestones",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community Driven",
      description: "Build and engage with your token community",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Arbitrum Powered",
      description: "Fast and low-cost transactions on Arbitrum network",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Real-time Analytics",
      description: "Track your token performance with detailed analytics",
    },
  ]

  const stats = [
    { label: "Tokens Launched", value: "1,234" },
    { label: "Total Volume", value: "$2.4M" },
    { label: "Active Creators", value: "567" },
    { label: "Community Members", value: "12.3K" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              XMenity
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
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
          </nav>

          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Star className="h-3 w-3 mr-1" />
            Powered by InsightIQ & Arbitrum
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
            Launch Your Social Token
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Create milestone-based tokens for your X (Twitter) community. Verified creators, automated tokenomics, and
            seamless Web3 integration.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Link href="/launch">
                <Rocket className="h-5 w-5 mr-2" />
                Launch Your Token
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link href="/explore">
                Explore Tokens
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tokens */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Tokens</h2>
            <p className="text-gray-600 dark:text-gray-300">Discover trending social tokens from verified creators</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {featuredTokens.map((token) => (
              <Card key={token.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Image
                        src={token.image || "/placeholder.svg"}
                        alt={token.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <CardTitle className="text-lg">{token.name}</CardTitle>
                        <CardDescription>{token.creator}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">{token.symbol}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Price</div>
                      <div className="font-semibold">{token.price}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">24h Change</div>
                      <div className="font-semibold text-green-600">{token.change}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Holders</div>
                      <div className="font-semibold">{token.holders}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Volume</div>
                      <div className="font-semibold">{token.volume}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link href="/explore">
                View All Tokens
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose XMenity?</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The most comprehensive platform for social token creation with built-in verification and milestone
              tracking
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-white">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Launch Your Social Token?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of creators who have already launched their tokens on XMenity. Get verified, set your
            milestones, and start building your community.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
              <Link href="/launch">
                <Rocket className="h-5 w-5 mr-2" />
                Launch Now
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 bg-transparent"
            >
              <Link href="/test-token">
                <Zap className="h-5 w-5 mr-2" />
                Try Test Suite
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">XMenity</span>
              </div>
              <p className="text-gray-400">The future of social token creation for X (Twitter) creators.</p>
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

            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 XMenity. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
