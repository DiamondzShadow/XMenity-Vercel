"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Target, 
  Users, 
  TrendingUp,
  Shield,
  Zap,
  Star,
  Award,
  Rocket,
  Upload,
  ExternalLink
} from "lucide-react"
import { useRouter } from "next/navigation"

interface TokenFormData {
  name: string
  symbol: string
  description: string
  logoUrl: string
  useInsightIQMetrics: boolean
  customTokenomics?: {
    totalSupply: string
    initialPrice: string
    milestones: Array<{
      holders: number
      reward: number
    }>
  }
}

interface UserProfile {
  walletAddress: string
  username: string
  platform: string
  verified: boolean
  tier: string
  influenceScore: number
  tokenomics: any
  profileImage: string
  followers: number
  engagementRate: number
}

export default function LaunchPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending')
  const [deploymentResult, setDeploymentResult] = useState<any>(null)
  
  const [formData, setFormData] = useState<TokenFormData>({
    name: "",
    symbol: "",
    description: "",
    logoUrl: "",
    useInsightIQMetrics: true,
  })

  const [verificationData, setVerificationData] = useState({
    username: "",
    platform: "twitter",
    walletAddress: "",
  })

  const steps = [
    { title: "Verification", description: "Verify your creator identity with InsightIQ" },
    { title: "Token Details", description: "Configure your social token" },
    { title: "Tokenomics", description: "Set up milestone-based rewards" },
    { title: "Review & Deploy", description: "Review and launch your token" },
  ]

  const handleVerification = async () => {
    setIsVerifying(true)
    try {
      const response = await fetch("/api/auth/insightiq-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verificationData),
      })

      const data = await response.json()
      
      if (data.success) {
        setUserProfile(data.user)
        setVerificationStatus('verified')
        setCurrentStep(1)
        
        // Pre-fill token data based on user profile
        setFormData(prev => ({
          ...prev,
          name: `${data.user.username} Token`,
          symbol: data.user.username.substring(0, 6).toUpperCase(),
          description: `Social token for ${data.user.username} - ${data.user.tier} tier creator`,
          logoUrl: data.user.profileImage,
        }))
      } else {
        setVerificationStatus('failed')
      }
    } catch (error) {
      console.error("Verification failed:", error)
      setVerificationStatus('failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    try {
      const response = await fetch("/api/tokens/milestone-deploy", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` // Assume JWT is stored
        },
        body: JSON.stringify({
          ...formData,
          creatorWallet: userProfile?.walletAddress,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setDeploymentResult(data)
        setCurrentStep(4) // Go to success step
      } else {
        throw new Error(data.error || "Deployment failed")
      }
    } catch (error) {
      console.error("Deployment failed:", error)
      alert("Deployment failed: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsDeploying(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Creator Verification</CardTitle>
              <CardDescription>
                Verify your creator identity with InsightIQ to unlock advanced tokenomics and platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-900">Follower Metrics</h3>
                  <p className="text-sm text-blue-700">Real-time follower tracking</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-900">Engagement Analysis</h3>
                  <p className="text-sm text-green-700">Track engagement rates</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-purple-900">Influence Score</h3>
                  <p className="text-sm text-purple-700">Measure your influence</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Social Media Username</Label>
                  <Input
                    id="username"
                    placeholder="@yourusername"
                    value={verificationData.username}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <select
                    id="platform"
                    className="w-full p-2 border rounded-md"
                    value={verificationData.platform}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, platform: e.target.value }))}
                  >
                    <option value="twitter">Twitter</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="wallet">Wallet Address</Label>
                  <Input
                    id="wallet"
                    placeholder="0x..."
                    value={verificationData.walletAddress}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, walletAddress: e.target.value }))}
                  />
                </div>
              </div>

              {verificationStatus === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-red-800 font-medium">Verification Failed</p>
                    <p className="text-red-600 text-sm">Please check your credentials and try again</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleVerification} 
                disabled={isVerifying || !verificationData.username || !verificationData.walletAddress}
                className="w-full"
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Verify with InsightIQ
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )

      case 1:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Token Configuration</CardTitle>
                  <CardDescription>
                    Configure your social token details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {userProfile && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <img src={userProfile.profileImage} alt="Profile" className="w-12 h-12 rounded-full" />
                    <div>
                      <h3 className="font-semibold">{userProfile.username}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{userProfile.tier} tier</Badge>
                        <Badge variant="outline">{userProfile.followers.toLocaleString()} followers</Badge>
                        <Badge variant="outline">{userProfile.influenceScore} influence</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Token Name</Label>
                  <Input
                    id="name"
                    placeholder="My Social Token"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="symbol">Token Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="MST"
                    value={formData.symbol}
                    onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your social token and its utility..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="logo">Logo URL (optional)</Label>
                <Input
                  id="logo"
                  placeholder="https://..."
                  value={formData.logoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.name || !formData.symbol}
                >
                  Next: Tokenomics
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Milestone-Based Tokenomics
              </CardTitle>
              <CardDescription>
                Your tokenomics are automatically calculated based on your creator metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {userProfile?.tokenomics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900">Total Supply</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {userProfile.tokenomics.totalSupply.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-900">Initial Price</h3>
                      <p className="text-2xl font-bold text-green-600">
                        ${userProfile.tokenomics.initialPrice}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-purple-900">Tier</h3>
                      <p className="text-2xl font-bold text-purple-600 capitalize">
                        {userProfile.tokenomics.tier}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Milestone Rewards
                    </h3>
                    <div className="space-y-3">
                      {userProfile.tokenomics.milestones.map((milestone: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{milestone.holders.toLocaleString()} Holders</p>
                              <p className="text-sm text-gray-600">{milestone.description}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {(milestone.reward * 100).toFixed(1)}% reward
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-800">Smart Tokenomics</h4>
                    </div>
                    <p className="text-amber-700 text-sm">
                      Your tokenomics are dynamically calculated based on your current metrics: 
                      {userProfile.followers.toLocaleString()} followers, 
                      {(userProfile.engagementRate * 100).toFixed(2)}% engagement rate, 
                      and {userProfile.influenceScore} influence score.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="use-insights"
                  checked={formData.useInsightIQMetrics}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useInsightIQMetrics: checked }))}
                />
                <Label htmlFor="use-insights">Use real-time InsightIQ metrics</Label>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(3)}>
                  Review & Deploy
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Rocket className="h-5 w-5 mr-2" />
                Review & Deploy
              </CardTitle>
              <CardDescription>
                Review your token configuration and deploy to the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Token Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Symbol:</span>
                      <span className="font-medium">{formData.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supply:</span>
                      <span className="font-medium">{userProfile?.tokenomics.totalSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">${userProfile?.tokenomics.initialPrice}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Creator Profile</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Username:</span>
                      <span className="font-medium">{userProfile?.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tier:</span>
                      <span className="font-medium capitalize">{userProfile?.tier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Followers:</span>
                      <span className="font-medium">{userProfile?.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verified:</span>
                      <span className="font-medium text-green-600">✓ InsightIQ</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Deployment Information</h4>
                </div>
                <p className="text-blue-700 text-sm">
                  Your token will be deployed on Arbitrum with milestone-based tokenomics. 
                  Gas fees will be minimal due to Arbitrum's low-cost infrastructure.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isDeploying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Deploy Token
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-600">Token Deployed Successfully!</CardTitle>
              <CardDescription>
                Your social token is now live on the Arbitrum network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {deploymentResult && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Deployment Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contract Address:</span>
                        <span className="font-mono text-green-600">{deploymentResult.contractAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction Hash:</span>
                        <span className="font-mono text-green-600">{deploymentResult.transactionHash.slice(0, 10)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Token ID:</span>
                        <span className="font-medium">{deploymentResult.tokenId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => router.push(`/analytics?contract=${deploymentResult.contractAddress}`)}
                      className="w-full"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://arbiscan.io/address/${deploymentResult.contractAddress}`, '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Arbiscan
                    </Button>
                  </div>

                  <div className="text-center">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setCurrentStep(0)
                        setFormData({
                          name: "",
                          symbol: "",
                          description: "",
                          logoUrl: "",
                          useInsightIQMetrics: true,
                        })
                        setUserProfile(null)
                        setDeploymentResult(null)
                      }}
                    >
                      Launch Another Token
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Launch Your Social Token
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create a professional social token with InsightIQ verification and milestone-based tokenomics
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    index <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${
                      index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-4 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}
      </div>
    </div>
  )
}
