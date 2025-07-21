"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Twitter, Shield, Zap, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function LaunchPage() {
  const [step, setStep] = useState(1)
  const [isConnected, setIsConnected] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const handleConnect = () => {
    setIsConnected(true)
    setTimeout(() => setIsVerified(true), 2000)
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
            <p className="text-gray-600">Create your community token in just a few steps</p>
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Twitter className="mr-2 h-5 w-5 text-blue-400" />
                  Connect X Account
                </CardTitle>
                <CardDescription>Connect and verify your X (Twitter) account to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected ? (
                  <Button onClick={handleConnect} className="w-full bg-blue-500 hover:bg-blue-600">
                    <Twitter className="mr-2 h-4 w-4" />
                    Connect X Account
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>X Account Connected</span>
                    </div>

                    {isVerified ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-green-600">
                          <Shield className="h-5 w-5" />
                          <span>InsightIQ Verification Complete</span>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Verified Creator</Badge>
                        <Button onClick={() => setStep(2)} className="w-full">
                          Continue to Token Setup
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-yellow-600">
                        <Shield className="h-5 w-5 animate-spin" />
                        <span>Verifying with InsightIQ...</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                    <Input id="tokenName" placeholder="My Creator Token" />
                  </div>
                  <div>
                    <Label htmlFor="tokenSymbol">Token Symbol</Label>
                    <Input id="tokenSymbol" placeholder="MCT" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe your token and community..." rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalSupply">Total Supply</Label>
                    <Input id="totalSupply" placeholder="1000000" type="number" />
                  </div>
                  <div>
                    <Label htmlFor="initialPrice">Initial Price (ETH)</Label>
                    <Input id="initialPrice" placeholder="0.001" type="number" step="0.001" />
                  </div>
                </div>

                <div>
                  <Label>Milestone Rewards</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>1K Followers</span>
                      <Badge>100 Tokens</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>10K Followers</span>
                      <Badge>500 Tokens</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>100K Followers</span>
                      <Badge>1000 Tokens</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Continue to Deploy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-purple-600" />
                  Deploy to Arbitrum
                </CardTitle>
                <CardDescription>Review and deploy your social token to the Arbitrum network</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">Token Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span>My Creator Token</span>
                    <span className="text-gray-600">Symbol:</span>
                    <span>MCT</span>
                    <span className="text-gray-600">Supply:</span>
                    <span>1,000,000</span>
                    <span className="text-gray-600">Network:</span>
                    <span>Arbitrum</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Deployment Cost</h4>
                  <div className="text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Gas Fee:</span>
                      <span>~0.002 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee:</span>
                      <span>0.01 ETH</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                      <span>Total:</span>
                      <span>~0.012 ETH</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <Zap className="mr-2 h-4 w-4" />
                    Deploy Token
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
