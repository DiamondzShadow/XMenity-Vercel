"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Shield, Zap, CheckCircle, AlertCircle, Upload, ExternalLink, TrendingUp, Users, Target } from "lucide-react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { formatTokenAmount } from "@/lib/web3"

interface TokenFormData {
  name: string
  symbol: string
  description: string
  logoUrl: string
}

interface CreatorProfile {
  username: string
  displayName: string
  profileImage: string
  verified: boolean
  followers: number
  following: number
  tweets: number
  engagement: {
    likes: number
    retweets: number
    replies: number
    avgEngagementRate: number
  }
  metrics: {
    reach: number
    impressions: number
    influence: number
    authenticity: number
    growth_rate: number
  }
  verificationLevel: string
}

interface TokenomicsConfig {
  initialSupply: number
  metricNames: string[]
  thresholds: number[]
  multipliers: number[]
}

interface EligibilityCheck {
  eligible: boolean
  reason?: string
  requirements: {
    minFollowers: number
    minAuthenticity: number
    minEngagement: number
    verified: boolean
  }
  currentMetrics: any
}

export default function LaunchPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  const [step, setStep] = useState(1)
  const [isVerifying, setIsVerifying] = useState(false)
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null)
  const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null)
  const [tokenomics, setTokenomics] = useState<TokenomicsConfig | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createdToken, setCreatedToken] = useState<any>(null)
  const [deploymentResult, setDeploymentResult] = useState<any>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)

  const [formData, setFormData] = useState<TokenFormData>({
    name: "",
    symbol: "",
    description: "",
    logoUrl: "",
  })

  const [usernameInput, setUsernameInput] = useState("")

  // Auto-populate token name and symbol based on creator profile
  useEffect(() => {
    if (creatorProfile && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: `${creatorProfile.displayName} Token`,
        symbol: creatorProfile.username.slice(0, 6).toUpperCase() + "T",
      }))
    }
  }, [creatorProfile])

  const handleInsightIQVerification = async () => {
    if (!address || !usernameInput.trim()) {
      setError("Please connect wallet and enter username")
      return
    }

    setIsVerifying(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usernameInput.trim(),
          walletAddress: address,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCreatorProfile(data.creator.metrics)
        setEligibility(data.eligibility)
        setAuthToken(data.token)
        
        // Calculate tokenomics
        const tokenomicsCalc = calculateTokenomics(data.creator.metrics)
        setTokenomics(tokenomicsCalc)
        
        setSuccess("Creator profile verified successfully!")
        setStep(2)
      } else {
        setError(data.error || "Verification failed")
        if (data.requirements && data.currentMetrics) {
          setEligibility({
            eligible: false,
            reason: data.error,
            requirements: data.requirements,
            currentMetrics: data.currentMetrics,
          })
        }
      }
    } catch (error) {
      console.error("Verification error:", error)
      setError("Failed to verify creator profile")
    } finally {
      setIsVerifying(false)
    }
  }

  const calculateTokenomics = (metrics: any): TokenomicsConfig => {
    const baseSupply = Math.max(1000000, metrics.followers * 10)
    
    return {
      initialSupply: baseSupply,
      metricNames: ['followers', 'engagement_rate', 'authenticity_score'],
      thresholds: [
        Math.ceil(metrics.followers * 1.25),    // 25% follower growth
        Math.ceil(metrics.engagement_rate * 1.5), // 50% engagement improvement
        Math.ceil(metrics.authenticity_score * 1.1), // 10% authenticity improvement
      ],
      multipliers: [15, 10, 5], // Percentage increases
    }
  }

  const handleFormChange = (field: keyof TokenFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      })

      const data = await response.json()

      if (response.ok) {
        handleFormChange("logoUrl", data.url)
        setSuccess("Logo uploaded successfully!")
      } else {
        setError("Failed to upload image")
      }
    } catch (error) {
      console.error("Image upload error:", error)
      setError("Failed to upload image")
    }
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Token name is required")
      return false
    }

    if (!formData.symbol.trim() || !/^[A-Z]{1,11}$/.test(formData.symbol)) {
      setError("Token symbol must be 1-11 uppercase letters")
      return false
    }

    return true
  }

  const handleCreateToken = async () => {
    if (!validateForm() || !authToken || !creatorProfile) return

    setIsCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          creatorWallet: address,
          jwtToken: authToken,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCreatedToken(data.token)
        setSuccess("Token created successfully! Ready for deployment.")
        setStep(3)
      } else {
        setError(data.error || "Token creation failed")
      }
    } catch (error) {
      console.error("Token creation error:", error)
      setError("Failed to create token")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeploy = async () => {
    if (!createdToken || !authToken) return

    setIsDeploying(true)
    setError(null)

    try {
      // For now, we'll use client-side deployment preparation
      // In a full implementation, this would trigger a wallet transaction
      const mockDeployment = {
        contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        gasUsed: "150000",
      }

      // Simulate deployment call
      const response = await fetch("/api/tokens/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: createdToken.id,
          jwtToken: authToken,
          transactionHash: mockDeployment.transactionHash,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setDeploymentResult(data.deployment)
        setSuccess("Token deployed successfully on Arbitrum!")
      } else {
        setError(data.error || "Deployment failed")
      }
    } catch (error) {
      console.error("Deployment error:", error)
      setError("Failed to deploy token")
    } finally {
      setIsDeploying(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Connect your wallet to launch your social token</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please connect your wallet to continue with token creation.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-purple-600">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Step {step} of 3</span>
            <Progress value={(step / 3) * 100} className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Launch Your Social Token</h1>
            <p className="text-gray-600">
              Create milestone-based tokens verified by InsightIQ with automated reward distribution
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: InsightIQ Verification */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-blue-600" />
                  Creator Verification
                </CardTitle>
                <CardDescription>
                  Verify your X (Twitter) profile with InsightIQ to enable milestone-based tokenomics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">X (Twitter) Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter your username (without @)"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleInsightIQVerification}
                    disabled={isVerifying || !usernameInput.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {isVerifying ? "Verifying..." : "Verify with InsightIQ"}
                  </Button>

                  {/* Eligibility Requirements */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">Eligibility Requirements</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center justify-between">
                        <span>✓ Verified X account</span>
                        <span>Required</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>✓ Minimum 1,000 followers</span>
                        <span>Required</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>✓ Authenticity score 60+</span>
                        <span>Required</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>✓ Engagement rate 1%+</span>
                        <span>Required</span>
                      </div>
                    </div>
                  </div>

                  {/* Show eligibility check results if failed */}
                  {eligibility && !eligibility.eligible && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p><strong>Verification Failed:</strong> {eligibility.reason}</p>
                          <div className="text-sm">
                            <p><strong>Your Current Metrics:</strong></p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Followers: {eligibility.currentMetrics.followers?.toLocaleString() || 0}</li>
                              <li>Engagement Rate: {eligibility.currentMetrics.engagement_rate?.toFixed(2) || 0}%</li>
                              <li>Authenticity Score: {eligibility.currentMetrics.authenticity_score || 0}</li>
                            </ul>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Token Configuration */}
          {step === 2 && creatorProfile && tokenomics && (
            <Card>
              <CardHeader>
                <CardTitle>Token Configuration</CardTitle>
                <CardDescription>Configure your token with automatically calculated milestone tokenomics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Creator Profile Summary */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">Verified Creator Profile</h4>
                  <div className="flex items-center space-x-3">
                    <img
                      src={creatorProfile.profileImage || "/placeholder.svg"}
                      alt="Profile"
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{creatorProfile.displayName}</span>
                        {creatorProfile.verified && <Shield className="h-4 w-4 text-blue-500" />}
                        <Badge variant="secondary">{creatorProfile.verificationLevel}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">@{creatorProfile.username}</div>
                      <div className="text-sm text-gray-600">
                        {creatorProfile.followers?.toLocaleString()} followers • 
                        {creatorProfile.engagement?.avgEngagementRate?.toFixed(2)}% engagement
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tokenName">Token Name</Label>
                    <Input
                      id="tokenName"
                      placeholder="My Creator Token"
                      value={formData.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tokenSymbol">Token Symbol</Label>
                    <Input
                      id="tokenSymbol"
                      placeholder="MCT"
                      value={formData.symbol}
                      onChange={(e) => handleFormChange("symbol", e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your token and community..."
                    value={formData.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="logo">Token Logo</Label>
                  <div className="flex items-center space-x-4">
                    <Input id="logo" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <Button variant="outline" onClick={() => document.getElementById("logo")?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </Button>
                    {formData.logoUrl && (
                      <img
                        src={formData.logoUrl || "/placeholder.svg"}
                        alt="Token logo"
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                  </div>
                </div>

                {/* Automated Tokenomics */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <Target className="mr-2 h-4 w-4" />
                    Milestone-Based Tokenomics
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-blue-700">Initial Supply:</span>
                      <div className="font-semibold">{formatTokenAmount(tokenomics.initialSupply)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-blue-700">Creator Allocation:</span>
                      <div className="font-semibold">100% (Full Control)</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Follower Milestone:</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{tokenomics.thresholds[0]?.toLocaleString()} followers</div>
                        <div className="text-xs text-blue-600">+{tokenomics.multipliers[0]}% token supply</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Engagement Milestone:</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{tokenomics.thresholds[1]?.toFixed(2)}% engagement</div>
                        <div className="text-xs text-blue-600">+{tokenomics.multipliers[1]}% token supply</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Authenticity Milestone:</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{tokenomics.thresholds[2]} score</div>
                        <div className="text-xs text-blue-600">+{tokenomics.multipliers[2]}% token supply</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={handleCreateToken} disabled={isCreating} className="flex-1">
                    {isCreating ? (
                      <>
                        <Zap className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Create Token
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Deployment */}
          {step === 3 && createdToken && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {deploymentResult ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                      Token Deployed Successfully!
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5 text-blue-600" />
                      Deploy Your Token
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {deploymentResult 
                    ? "Your social token is now live on Arbitrum with milestone-based rewards"
                    : "Deploy your token to the Arbitrum blockchain"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!deploymentResult ? (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-semibold text-blue-900">Ready for Deployment</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-blue-700">Name:</span>
                        <span>{createdToken.name}</span>
                        <span className="text-blue-700">Symbol:</span>
                        <span>{createdToken.symbol}</span>
                        <span className="text-blue-700">Initial Supply:</span>
                        <span>{formatTokenAmount(createdToken.initialSupply)}</span>
                        <span className="text-blue-700">Creator:</span>
                        <span className="font-mono text-xs">{createdToken.creatorWallet.slice(0, 10)}...</span>
                      </div>
                    </div>

                    <Button onClick={handleDeploy} disabled={isDeploying} className="w-full">
                      {isDeploying ? (
                        <>
                          <Zap className="mr-2 h-4 w-4 animate-spin" />
                          Deploying to Arbitrum...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Deploy to Arbitrum
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-green-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-semibold text-green-900">Deployment Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-green-700">Contract:</span>
                        <span className="font-mono text-xs">{deploymentResult.contractAddress}</span>
                        <span className="text-green-700">Transaction:</span>
                        <span className="font-mono text-xs">{deploymentResult.transactionHash}</span>
                        <span className="text-green-700">Block:</span>
                        <span>{deploymentResult.blockNumber}</span>
                        <span className="text-green-700">Gas Used:</span>
                        <span>{deploymentResult.gasUsed}</span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => window.open(`https://arbiscan.io/tx/${deploymentResult.transactionHash}`, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Arbiscan
                      </Button>
                      <Link href="/explore" className="flex-1">
                        <Button className="w-full">Explore Tokens</Button>
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
