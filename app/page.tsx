import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, Shield, TrendingUp, Users, Zap, Twitter } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Rocket className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              XMenity
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-purple-600 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-purple-600 transition-colors">
              How it Works
            </Link>
            <Link href="#creators" className="text-gray-600 hover:text-purple-600 transition-colors">
              For Creators
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              Connect Wallet
            </Button>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              Launch Token
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-100">
            🚀 Powered by Arbitrum & InsightIQ
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            XMenity Social Token Factory
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A comprehensive platform for X (Twitter) creators to launch their own community tokens on Arbitrum, powered
            by InsightIQ verification and milestone-based tokenomics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3">
              <Twitter className="mr-2 h-5 w-5" />
              Connect X Account
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-transparent">
              Explore Tokens
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to create, manage, and grow your social token community
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mb-2" />
              <CardTitle>InsightIQ Verification</CardTitle>
              <CardDescription>Verified creator authentication through InsightIQ integration</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-green-600 mb-2" />
              <CardTitle>Milestone-Based Tokenomics</CardTitle>
              <CardDescription>Token rewards tied to creator milestones and community engagement</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Zap className="h-12 w-12 text-purple-600 mb-2" />
              <CardTitle>Arbitrum Integration</CardTitle>
              <CardDescription>Fast, low-cost transactions on the Arbitrum network</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-orange-600 mb-2" />
              <CardTitle>Community Building</CardTitle>
              <CardDescription>Tools to engage and reward your most loyal followers</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Twitter className="h-12 w-12 text-blue-400 mb-2" />
              <CardTitle>X Integration</CardTitle>
              <CardDescription>Seamless integration with X (Twitter) for creator verification</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Rocket className="h-12 w-12 text-red-600 mb-2" />
              <CardTitle>Easy Launch</CardTitle>
              <CardDescription>Launch your social token in minutes with our intuitive interface</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Launch your social token in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect & Verify</h3>
              <p className="text-gray-600">Connect your X account and get verified through InsightIQ</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Configure Token</h3>
              <p className="text-gray-600">Set up your token parameters, milestones, and reward structure</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Launch & Grow</h3>
              <p className="text-gray-600">Deploy your token on Arbitrum and start building your community</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Launch Your Social Token?</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Join the future of creator economy with XMenity Social Token Factory
          </p>
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3">
            <Rocket className="mr-2 h-5 w-5" />
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Rocket className="h-6 w-6 text-purple-400" />
                <span className="text-xl font-bold">XMenity</span>
              </div>
              <p className="text-gray-400">Empowering creators with social token technology on Arbitrum.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Creators</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Launch Token
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Success Stories
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Resources
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Community
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 XMenity Social Token Factory. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
