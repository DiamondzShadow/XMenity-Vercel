"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { TestTube, Plus, X, Play, CheckCircle, XCircle, Loader2, Target, Zap, Shield, Coins } from "lucide-react"
import { WalletConnect } from "@/components/wallet-connect"
import { useAccount } from "wagmi"

interface CustomMetric {
  name: string
  threshold: number
  weight: number
}

interface TestResult {
  step: string
  status: "pending" | "running" | "success" | "error"
  message: string
  data?: any
}

export default function TestTokenPage() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState("setup")

  // Token Configuration
  const [tokenConfig, setTokenConfig] = useState({
    name: "TestToken",
    symbol: "TEST",
    totalSupply: "1000000",
    description: "A test token for modular metrics testing",
    testUsername: "testcreator",
  })

  // Custom Metrics
  const [customMetrics, setCustomMetrics] = useState<CustomMetric[]>([
    { name: "followers", threshold: 10000, weight: 40 },
    { name: "engagement", threshold: 5000, weight: 35 },
    { name: "views", threshold: 50000, weight: 25 },
  ])

  // Test Results
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [currentTestIndex, setCurrentTestIndex] = useState(0)

  const addCustomMetric = () => {
    setCustomMetrics([...customMetrics, { name: "", threshold: 0, weight: 0 }])
  }

  const removeCustomMetric = (index: number) => {
    setCustomMetrics(customMetrics.filter((_, i) => i !== index))
  }

  const updateCustomMetric = (index: number, field: keyof CustomMetric, value: string | number) => {
    const updated = [...customMetrics]
    updated[index] = { ...updated[index], [field]: value }
    setCustomMetrics(updated)
  }

  const runTests = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }

    setIsRunningTests(true)
    setCurrentTestIndex(0)
    setTestResults([])

    const tests = [
      {
        step: "InsightIQ Verification",
        test: async () => {
          const response = await fetch("/api/auth/insightiq", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: tokenConfig.testUsername }),
          })
          return await response.json()
        },
      },
      {
        step: "Token Deployment",
        test: async () => {
          const response = await fetch("/api/tokens/deploy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: tokenConfig.name,
              symbol: tokenConfig.symbol,
              totalSupply: tokenConfig.totalSupply,
              description: tokenConfig.description,
              creatorWallet: address,
              metrics: customMetrics.map((m) => m.name),
              thresholds: customMetrics.map((m) => m.threshold),
              weights: customMetrics.map((m) => m.weight),
            }),
          })
          return await response.json()
        },
      },
      {
        step: "Token Retrieval",
        test: async () => {
          const response = await fetch("/api/tokens")
          return await response.json()
        },
      },
    ]

    for (let i = 0; i < tests.length; i++) {
      setCurrentTestIndex(i)

      const result: TestResult = {
        step: tests[i].step,
        status: "running",
        message: `Running ${tests[i].step}...`,
      }

      setTestResults((prev) => [...prev, result])

      try {
        const testResult = await tests[i].test()

        setTestResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: testResult.success ? "success" : "error",
                  message: testResult.success
                    ? `${tests[i].step} completed successfully`
                    : testResult.error || `${tests[i].step} failed`,
                  data: testResult,
                }
              : r,
          ),
        )

        // Wait a bit between tests
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        setTestResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: "error",
                  message: `${tests[i].step} failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                  data: { error: error instanceof Error ? error.message : "Unknown error" },
                }
              : r,
          ),
        )
      }
    }

    setIsRunningTests(false)
  }

  const totalWeight = customMetrics.reduce((sum, metric) => sum + metric.weight, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TestTube className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">Token Testing Lab</span>
          </div>
          <WalletConnect />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Test Modular Token Creation</h1>
            <p className="text-gray-600">
              Test the complete flow of creating tokens with custom metrics and milestone rewards
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="metrics">Custom Metrics</TabsTrigger>
              <TabsTrigger value="test">Run Tests</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Coins className="mr-2 h-5 w-5" />
                    Token Configuration
                  </CardTitle>
                  <CardDescription>Configure your test token parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Token Name</Label>
                      <Input
                        id="name"
                        value={tokenConfig.name}
                        onChange={(e) => setTokenConfig({ ...tokenConfig, name: e.target.value })}
                        placeholder="My Social Token"
                      />
                    </div>
                    <div>
                      <Label htmlFor="symbol">Token Symbol</Label>
                      <Input
                        id="symbol"
                        value={tokenConfig.symbol}
                        onChange={(e) => setTokenConfig({ ...tokenConfig, symbol: e.target.value.toUpperCase() })}
                        placeholder="MST"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="supply">Total Supply</Label>
                    <Input
                      id="supply"
                      type="number"
                      value={tokenConfig.totalSupply}
                      onChange={(e) => setTokenConfig({ ...tokenConfig, totalSupply: e.target.value })}
                      placeholder="1000000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={tokenConfig.description}
                      onChange={(e) => setTokenConfig({ ...tokenConfig, description: e.target.value })}
                      placeholder="Describe your token and its purpose..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="username">Test Username (for InsightIQ)</Label>
                    <Input
                      id="username"
                      value={tokenConfig.testUsername}
                      onChange={(e) => setTokenConfig({ ...tokenConfig, testUsername: e.target.value })}
                      placeholder="your_social_handle"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Custom Metrics Configuration
                  </CardTitle>
                  <CardDescription>Define your success metrics, thresholds, and reward weights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <Label>Metric Name</Label>
                        <Input
                          value={metric.name}
                          onChange={(e) => updateCustomMetric(index, "name", e.target.value)}
                          placeholder="followers, likes, views..."
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Threshold</Label>
                        <Input
                          type="number"
                          value={metric.threshold}
                          onChange={(e) => updateCustomMetric(index, "threshold", Number.parseInt(e.target.value) || 0)}
                          placeholder="10000"
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Weight (%)</Label>
                        <Input
                          type="number"
                          value={metric.weight}
                          onChange={(e) => updateCustomMetric(index, "weight", Number.parseInt(e.target.value) || 0)}
                          placeholder="25"
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => removeCustomMetric(index)} className="mt-6">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center justify-between">
                    <Button onClick={addCustomMetric} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Metric
                    </Button>
                    <div className="text-sm">
                      Total Weight:{" "}
                      <Badge variant={totalWeight === 100 ? "default" : "destructive"}>{totalWeight}%</Badge>
                    </div>
                  </div>

                  {totalWeight !== 100 && (
                    <Alert>
                      <AlertDescription>
                        Warning: Total weight should equal 100% for optimal reward distribution
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Play className="mr-2 h-5 w-5" />
                    Run Test Suite
                  </CardTitle>
                  <CardDescription>Execute the complete token creation and verification flow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isConnected ? (
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>Please connect your wallet to run tests</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Test Configuration Summary:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            Token: {tokenConfig.name} ({tokenConfig.symbol})
                          </div>
                          <div>Supply: {Number(tokenConfig.totalSupply).toLocaleString()}</div>
                          <div>Metrics: {customMetrics.length}</div>
                          <div>
                            Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={runTests}
                        disabled={isRunningTests || totalWeight !== 100}
                        className="w-full"
                        size="lg"
                      >
                        {isRunningTests ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Running Tests...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            Run Complete Test Suite
                          </>
                        )}
                      </Button>

                      {isRunningTests && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{currentTestIndex + 1}/3</span>
                          </div>
                          <Progress value={((currentTestIndex + 1) / 3) * 100} />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Test Results
                  </CardTitle>
                  <CardDescription>Detailed results from the test execution</CardDescription>
                </CardHeader>
                <CardContent>
                  {testResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No test results yet. Run the test suite to see results here.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {testResults.map((result, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{result.step}</h4>
                            <div className="flex items-center">
                              {result.status === "running" && (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              )}
                              {result.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {result.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                              <Badge
                                variant={
                                  result.status === "success"
                                    ? "default"
                                    : result.status === "error"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="ml-2"
                              >
                                {result.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                          {result.data && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-blue-600">View Raw Data</summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
