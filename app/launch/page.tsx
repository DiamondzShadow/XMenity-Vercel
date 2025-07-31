"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Shield, Zap, CheckCircle, AlertCircle, Upload, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useAccount } from "wagmi"

interface TokenFormData {
  name: string
  symbol: string
  description: string
  logoUrl: string
  totalSupply: string
  initialSupply: string
}

interface CreatorProfile {
  username: string
  displayName: string
  profileImage: string
  followerCount: number
  isVerified: boolean
  verificationLevel: string
  engagementRate: number
}

export default function LaunchPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  const [step, setStep] = useState(1)
  const [isVerifying, setIsVerifying] = useState(false)
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deploymentResult, setDeploymentResult] = useState<any>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)

  const [formData, setFormData] = useState<TokenFormData>({
    name: "",
    symbol: "",
    description: "",
    logoUrl: "",
    totalSupply: "1000000",
    initialSupply: "100000",
  })

  const [usernameInput, setUsernameInput] = useState("")

  const handleInsightIQVerification = async () => {
    if (!address || !usernameInput.trim()) {
      setError("Please connect wallet and enter username")
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/insightiq", {
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
        setCreatorProfile(data.user)
        setAuthToken(data.token)
        setStep(2)
      } else {
        setError(data.error || "Verification failed")
      }
    } catch (error) {
      console.error("Verification error:", error)
      setError("Failed to verify creator profile")
    } finally {
      setIsVerifying(false)
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
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        handleFormChange("logoUrl", data.url)
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

    if (!formData.totalSupply || Number.parseFloat(formData.totalSupply) <= 0) {
      setError("Total supply must be greater than 0")
      return false
    }

    if (!formData.initialSupply || Number.parseFloat(formData.initialSupply) <= 0) {
      setError("Initial supply must be greater than 0")
      return false
    }

    if (Number.parseFloat(formData.initialSupply) > Number.parseFloat(formData.totalSupply)) {
      setError("Initial supply cannot exceed total supply")
      return false
    }

    return true
  }

  const handleDeploy = async () => {
    if (!validateForm() || !authToken || !creatorProfile) return

    setIsDeploying(true)
    setError(null)

    try {
      const milestoneConfig = {
        followers_1k: creatorProfile.followerCount < 1000,
        followers_10k: creatorProfile.followerCount < 10000,
        followers_100k: creatorProfile.followerCount < 100000,
        current_followers: creatorProfile.followerCount,
      }

      const response = await fetch("/api/tokens/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...formData,
          milestoneConfig,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setDeploymentResult(data.token)
        setStep(3)
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
              Create your community token with InsightIQ verification and milestone rewards
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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
                  Verify your creator profile with InsightIQ to enable milestone-based tokenomics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!creatorProfile ? (
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                      <img
                        src={creatorProfile.profileImage || "/placeholder.svg"}
                        alt="Profile"
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{creatorProfile.displayName}</span>
                          {creatorProfile.isVerified && <Shield className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div className="text-sm text-gray-600">@{creatorProfile.username}</div>
                        <div className="text-sm text-gray-600">
                          {creatorProfile.followerCount.toLocaleString()} followers
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {creatorProfile.verificationLevel} verification
                        </Badge>
                      </div>
                    </div>
                    <Button onClick={() => setStep(2)} className="w-full">
                      Continue to Token Setup
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Token Configuration */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Token Configuration</CardTitle>
                <CardDescription>Set up your token parameters and milestone rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalSupply">Total Supply</Label>
                    <Input
                      id="totalSupply"
                      placeholder="1000000"
                      value={formData.totalSupply}
                      onChange={(e) => handleFormChange("totalSupply", e.target.value)}
                      type="number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="initialSupply">Initial Supply</Label>
                    <Input
                      id="initialSupply"
                      placeholder="100000"
                      value={formData.initialSupply}
                      onChange={(e) => handleFormChange("initialSupply", e.target.value)}
                      type="number"
                    />
                  </div>
                </div>

                {/* Milestone Preview */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">Milestone Rewards</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>1K Followers:</span>
                      <span>
                        {(Number.parseFloat(formData.totalSupply || "0") * 0.01).toLocaleString()} tokens (1%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>10K Followers:</span>
                      <span>
                        {(Number.parseFloat(formData.totalSupply || "0") * 0.02).toLocaleString()} tokens (2%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>100K Followers:</span>
                      <span>
                        {(Number.parseFloat(formData.totalSupply || "0") * 0.05).toLocaleString()} tokens (5%)
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between text-sm">
                      <span>Current Followers:</span>
                      <span>{creatorProfile?.followerCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={handleDeploy} disabled={isDeploying} className="flex-1">
                    {isDeploying ? (
                      <>
                        <Zap className="mr-2 h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Deploy Token
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Success */}
          {step === 3 && deploymentResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Token Deployed Successfully!
                </CardTitle>
                <CardDescription>Your social token is now live on Arbitrum</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-green-900">Token Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-green-700">Name:</span>
                    <span>{deploymentResult.name}</span>
                    <span className="text-green-700">Symbol:</span>
                    <span>{deploymentResult.symbol}</span>
                    <span className="text-green-700">Contract:</span>
                    <span className="font-mono text-xs">{deploymentResult.contractAddress}</span>
                    <span className="text-green-700">Transaction:</span>
                    <span className="font-mono text-xs">{deploymentResult.transactionHash}</span>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
