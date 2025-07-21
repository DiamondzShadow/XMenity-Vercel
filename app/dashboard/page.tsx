"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arbitrum } from "wagmi/chains";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Twitter, 
  Wallet, 
  Coins, 
  Badge as BadgeIcon, 
  Gift, 
  TrendingUp, 
  Users, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Loader2,
  Settings,
  BarChart3,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { 
  insightIQService, 
  InsightIQHelpers,
  type InsightIQProfile,
  type InsightIQEngagementData 
} from "@/lib/insightiq";
import { 
  socialTokenFactory,
  creatorWalletFactory,
  creatorIdentityNFT,
  rewardDistributor,
  getCreatorTokenContract,
  type TokenConfig,
  type CreatorData,
  type TokenMetrics
} from "@/lib/contracts";

interface DashboardStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  icon: any;
}

export default function CreatorDashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [insightIQProfile, setInsightIQProfile] = useState<InsightIQProfile | null>(null);
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [tokenMetrics, setTokenMetrics] = useState<TokenMetrics | null>(null);
  const [nftTokenId, setNftTokenId] = useState<number | null>(null);
  const [campaignIds, setCampaignIds] = useState<number[]>([]);

  // Form states
  const [twitterHandle, setTwitterHandle] = useState("");
  const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
    name: "",
    symbol: "",
    tokensPerFollower: BigInt(1),
    tokensPerPost: BigInt(10),
    maxSupply: BigInt(0) // 0 for unlimited
  });

  // Step tracking
  const [steps, setSteps] = useState<DashboardStep[]>([
    {
      id: 'connect',
      title: 'Connect Wallet',
      description: 'Connect your Web3 wallet to get started',
      status: 'pending',
      icon: Wallet
    },
    {
      id: 'verify',
      title: 'Verify Twitter Account',
      description: 'Connect and verify your Twitter account with InsightIQ',
      status: 'pending',
      icon: Twitter
    },
    {
      id: 'wallet',
      title: 'Deploy Creator Wallet',
      description: 'Create your smart contract wallet on Arbitrum',
      status: 'pending',
      icon: Wallet
    },
    {
      id: 'token',
      title: 'Launch Community Token',
      description: 'Deploy your custom ERC-20 token with milestone mechanics',
      status: 'pending',
      icon: Coins
    },
    {
      id: 'badge',
      title: 'Mint Identity NFT',
      description: 'Create your verified creator badge (Soulbound Token)',
      status: 'pending',
      icon: BadgeIcon
    },
    {
      id: 'rewards',
      title: 'Setup Rewards',
      description: 'Configure token distribution to your community',
      status: 'pending',
      icon: Gift
    }
  ]);

  // Update step status
  const updateStepStatus = (stepId: string, status: DashboardStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  // Check if on correct network
  const isOnArbitrum = chainId === arbitrum.id;

  // Initialize dashboard state
  useEffect(() => {
    if (isConnected && address) {
      updateStepStatus('connect', 'completed');
      loadCreatorData();
    } else {
      updateStepStatus('connect', 'pending');
    }
  }, [isConnected, address]);

  // Load existing creator data
  const loadCreatorData = async () => {
    if (!address) return;

    try {
      setIsLoading(true);

      // Check if creator is verified
      const isVerified = await socialTokenFactory.call("getVerifiedCreatorStatus", [address]);
      
      if (isVerified) {
        updateStepStatus('verify', 'completed');
        
        // Load creator data
        const data = await socialTokenFactory.call("getCreatorData", [address]) as any;
        setCreatorData({
          handle: data[0],
          platform: data[1],
          initialFollowers: data[2],
          verificationTimestamp: data[3],
          isVerified: data[4],
          tokenAddress: data[5]
        });

        // Check for wallet
        const wallet = await creatorWalletFactory.call("getCreatorWallet", [address]) as string;
        if (wallet && wallet !== "0x0000000000000000000000000000000000000000") {
          setWalletAddress(wallet);
          updateStepStatus('wallet', 'completed');
        }

        // Check for token
        if (data[5] && data[5] !== "0x0000000000000000000000000000000000000000") {
          setTokenAddress(data[5]);
          updateStepStatus('token', 'completed');
          
          // Load token metrics
          const tokenContract = getCreatorTokenContract(data[5]);
          const metrics = await tokenContract.call("getTokenMetrics", []) as any;
          setTokenMetrics({
            totalSupply: metrics[0],
            lastFollowerCount: metrics[1],
            lastPostCount: metrics[2],
            tokensPerFollower: metrics[3],
            tokensPerPost: metrics[4],
            maxSupply: metrics[5],
            creator: metrics[6],
            oracle: metrics[7]
          });
        }

        // Check for NFT badge
        const hasNFT = await creatorIdentityNFT.call("hasCreatorBadge", [address]) as boolean;
        if (hasNFT) {
          updateStepStatus('badge', 'completed');
          const tokenId = await creatorIdentityNFT.call("getCreatorTokenId", [address]) as number;
          setNftTokenId(tokenId);
        }

        // Load reward campaigns
        const campaigns = await rewardDistributor.call("getCreatorCampaigns", [address]) as number[];
        if (campaigns.length > 0) {
          setCampaignIds(campaigns);
          updateStepStatus('rewards', 'completed');
        }
      }
    } catch (error) {
      console.error('Error loading creator data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to InsightIQ and verify Twitter
  const verifyTwitterAccount = async () => {
    if (!twitterHandle.trim()) {
      toast.error("Please enter your Twitter handle");
      return;
    }

    if (!InsightIQHelpers.validateHandle(twitterHandle, 'twitter')) {
      toast.error("Invalid Twitter handle format");
      return;
    }

    try {
      setIsLoading(true);
      updateStepStatus('verify', 'in-progress');

      // In a real implementation, this would redirect to InsightIQ OAuth
      // For now, we'll simulate the verification process
      
      // Generate OAuth URL and redirect user
      const redirectUri = `${window.location.origin}/auth/insightiq/callback`;
      const oauthUrl = insightIQService.getOAuthUrl(redirectUri, address);
      
      // Store handle for later use
      sessionStorage.setItem('twitterHandle', twitterHandle);
      sessionStorage.setItem('creatorAddress', address!);
      
      // Redirect to InsightIQ OAuth (this would be replaced with actual OAuth flow)
      toast.info("Redirecting to InsightIQ for verification...");
      
      // Simulate successful verification for demo
      setTimeout(async () => {
        try {
          // Mock InsightIQ profile data
          const mockProfile: InsightIQProfile = {
            id: 'mock_user_id',
            username: twitterHandle.replace('@', ''),
            handle: twitterHandle,
            platform: 'twitter',
            displayName: `Creator ${twitterHandle}`,
            bio: 'Verified creator on XMenity',
            profileImageUrl: 'https://via.placeholder.com/150',
            followers: 5000 + Math.floor(Math.random() * 10000),
            following: 500,
            posts: 1200,
            verified: true,
            engagementRate: 3.5 + Math.random() * 2,
            influenceScore: 75 + Math.random() * 20,
            averageLikes: 150,
            averageComments: 25,
            lastActivityAt: new Date().toISOString(),
            isActive: true
          };

          setInsightIQProfile(mockProfile);

          // Call smart contract to verify creator
          await socialTokenFactory.call("verifyCreator", [
            address,
            mockProfile.handle,
            mockProfile.platform,
            BigInt(mockProfile.followers)
          ]);

          updateStepStatus('verify', 'completed');
          toast.success("Twitter account verified successfully!");
          
          // Generate token config suggestions
          const symbol = InsightIQHelpers.generateTokenSymbol(mockProfile.handle);
          const tokensPerFollower = InsightIQHelpers.getRecommendedTokensPerFollower(mockProfile.followers);
          
          setTokenConfig({
            name: `${mockProfile.displayName} Token`,
            symbol: symbol,
            tokensPerFollower: BigInt(tokensPerFollower),
            tokensPerPost: BigInt(tokensPerFollower * 10),
            maxSupply: BigInt(0)
          });

          await loadCreatorData();

        } catch (error) {
          console.error('Error verifying creator:', error);
          updateStepStatus('verify', 'error');
          toast.error("Failed to verify Twitter account");
        }
      }, 2000);

    } catch (error) {
      console.error('Error starting verification:', error);
      updateStepStatus('verify', 'error');
      toast.error("Failed to start verification process");
    } finally {
      setIsLoading(false);
    }
  };

  // Deploy creator wallet
  const deployWallet = async () => {
    try {
      setIsLoading(true);
      updateStepStatus('wallet', 'in-progress');

      const result = await creatorWalletFactory.call("createWallet", []);
      setWalletAddress(result);
      
      updateStepStatus('wallet', 'completed');
      toast.success("Creator wallet deployed successfully!");
      
    } catch (error) {
      console.error('Error deploying wallet:', error);
      updateStepStatus('wallet', 'error');
      toast.error("Failed to deploy creator wallet");
    } finally {
      setIsLoading(false);
    }
  };

  // Deploy community token
  const deployToken = async () => {
    if (!tokenConfig.name || !tokenConfig.symbol) {
      toast.error("Please fill in token name and symbol");
      return;
    }

    try {
      setIsLoading(true);
      updateStepStatus('token', 'in-progress');

      const deploymentFee = await socialTokenFactory.call("deploymentFee", []) as bigint;
      
      const result = await socialTokenFactory.call("createToken", 
        [tokenConfig], 
        { value: deploymentFee }
      );
      
      // Get token address from event or query
      const tokenAddr = await socialTokenFactory.call("getCreatorToken", [address]) as string;
      setTokenAddress(tokenAddr);
      
      updateStepStatus('token', 'completed');
      toast.success(`Token ${tokenConfig.symbol} deployed successfully!`);
      
      await loadCreatorData();
      
    } catch (error) {
      console.error('Error deploying token:', error);
      updateStepStatus('token', 'error');
      toast.error("Failed to deploy community token");
    } finally {
      setIsLoading(false);
    }
  };

  // Mint identity NFT
  const mintIdentityNFT = async () => {
    if (!insightIQProfile) {
      toast.error("Please verify your Twitter account first");
      return;
    }

    try {
      setIsLoading(true);
      updateStepStatus('badge', 'in-progress');

      const tokenId = await creatorIdentityNFT.call("mintCreatorBadge", [
        address,
        insightIQProfile.handle,
        insightIQProfile.platform,
        BigInt(insightIQProfile.followers),
        insightIQProfile.profileImageUrl,
        BigInt(Math.floor(insightIQProfile.influenceScore))
      ]);
      
      setNftTokenId(tokenId);
      updateStepStatus('badge', 'completed');
      toast.success("Identity NFT minted successfully!");
      
    } catch (error) {
      console.error('Error minting NFT:', error);
      updateStepStatus('badge', 'error');
      toast.error("Failed to mint identity NFT");
    } finally {
      setIsLoading(false);
    }
  };

  // Setup reward campaign
  const setupRewards = async () => {
    if (!tokenAddress) {
      toast.error("Please deploy your community token first");
      return;
    }

    try {
      setIsLoading(true);
      updateStepStatus('rewards', 'in-progress');

      // Create a sample reward campaign
      const rewardAmount = BigInt(1000) * BigInt(10**18); // 1000 tokens
      const duration = 30 * 24 * 60 * 60; // 30 days
      
      const campaignId = await rewardDistributor.call("createCampaign", [
        tokenAddress,
        rewardAmount,
        BigInt(duration),
        "0x0000000000000000000000000000000000000000000000000000000000000000", // No merkle root (direct distribution)
        "Welcome Campaign - Rewards for early supporters"
      ]);
      
      setCampaignIds([...campaignIds, campaignId]);
      updateStepStatus('rewards', 'completed');
      toast.success("Reward campaign created successfully!");
      
    } catch (error) {
      console.error('Error setting up rewards:', error);
      updateStepStatus('rewards', 'error');
      toast.error("Failed to setup reward campaign");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getStepComponent = (step: DashboardStep) => {
    const Icon = step.icon;
    
    return (
      <Card key={step.id} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              step.status === 'completed' ? 'bg-green-100 text-green-700' :
              step.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
              step.status === 'error' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {step.status === 'completed' ? <CheckCircle className="h-5 w-5" /> :
               step.status === 'error' ? <AlertCircle className="h-5 w-5" /> :
               step.status === 'in-progress' ? <Loader2 className="h-5 w-5 animate-spin" /> :
               <Icon className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {step.id === 'connect' && (
            <div className="space-y-4">
              {!isConnected ? (
                <ConnectButton />
              ) : !isOnArbitrum ? (
                <Button onClick={() => switchChain({ chainId: arbitrum.id })}>
                  Switch to Arbitrum
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Connected to Arbitrum</span>
                </div>
              )}
            </div>
          )}

          {step.id === 'verify' && step.status !== 'completed' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="twitter-handle">Twitter Handle</Label>
                <Input
                  id="twitter-handle"
                  placeholder="@yourhandle"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                />
              </div>
              <Button 
                onClick={verifyTwitterAccount}
                disabled={isLoading || !isConnected}
                className="w-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Twitter className="h-4 w-4 mr-2" />}
                Verify Twitter Account
              </Button>
            </div>
          )}

          {step.id === 'verify' && step.status === 'completed' && insightIQProfile && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img 
                  src={insightIQProfile.profileImageUrl} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{insightIQProfile.displayName}</p>
                  <p className="text-sm text-gray-500">{insightIQProfile.handle}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Followers:</span>
                  <span className="ml-2 font-medium">{InsightIQHelpers.formatFollowerCount(insightIQProfile.followers)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Posts:</span>
                  <span className="ml-2 font-medium">{insightIQProfile.posts.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {step.id === 'wallet' && step.status !== 'completed' && (
            <Button 
              onClick={deployWallet}
              disabled={isLoading || !isConnected || steps.find(s => s.id === 'verify')?.status !== 'completed'}
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
              Deploy Creator Wallet
            </Button>
          )}

          {step.id === 'wallet' && step.status === 'completed' && walletAddress && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Wallet Address:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(walletAddress)}
                  className="h-auto p-1"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
          )}

          {step.id === 'token' && step.status !== 'completed' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="token-name">Token Name</Label>
                  <Input
                    id="token-name"
                    placeholder="My Creator Token"
                    value={tokenConfig.name}
                    onChange={(e) => setTokenConfig({...tokenConfig, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="token-symbol">Symbol</Label>
                  <Input
                    id="token-symbol"
                    placeholder="MCT"
                    value={tokenConfig.symbol}
                    onChange={(e) => setTokenConfig({...tokenConfig, symbol: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tokens-per-follower">Tokens per Follower</Label>
                  <Input
                    id="tokens-per-follower"
                    type="number"
                    value={tokenConfig.tokensPerFollower.toString()}
                    onChange={(e) => setTokenConfig({...tokenConfig, tokensPerFollower: BigInt(e.target.value || 0)})}
                  />
                </div>
                <div>
                  <Label htmlFor="tokens-per-post">Tokens per Post</Label>
                  <Input
                    id="tokens-per-post"
                    type="number"
                    value={tokenConfig.tokensPerPost.toString()}
                    onChange={(e) => setTokenConfig({...tokenConfig, tokensPerPost: BigInt(e.target.value || 0)})}
                  />
                </div>
              </div>
              <Button 
                onClick={deployToken}
                disabled={isLoading || !isConnected || steps.find(s => s.id === 'wallet')?.status !== 'completed'}
                className="w-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Coins className="h-4 w-4 mr-2" />}
                Deploy Community Token
              </Button>
            </div>
          )}

          {step.id === 'token' && step.status === 'completed' && tokenMetrics && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Token:</span>
                <span className="font-medium">{tokenConfig.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Supply:</span>
                <span className="font-medium">{tokenMetrics.totalSupply.toString()} tokens</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Current Followers:</span>
                <span className="font-medium">{tokenMetrics.lastFollowerCount.toString()}</span>
              </div>
            </div>
          )}

          {step.id === 'badge' && step.status !== 'completed' && (
            <Button 
              onClick={mintIdentityNFT}
              disabled={isLoading || !isConnected || !insightIQProfile}
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BadgeIcon className="h-4 w-4 mr-2" />}
              Mint Identity NFT
            </Button>
          )}

          {step.id === 'badge' && step.status === 'completed' && nftTokenId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BadgeIcon className="h-4 w-4" />
                <span className="text-sm">Identity NFT #${nftTokenId}</span>
              </div>
              <p className="text-xs text-gray-500">Your verified creator badge is now minted as a soulbound token</p>
            </div>
          )}

          {step.id === 'rewards' && step.status !== 'completed' && (
            <Button 
              onClick={setupRewards}
              disabled={isLoading || !isConnected || !tokenAddress}
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
              Create Reward Campaign
            </Button>
          )}

          {step.id === 'rewards' && step.status === 'completed' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span className="text-sm">{campaignIds.length} Campaign(s) Active</span>
              </div>
              <p className="text-xs text-gray-500">You can now distribute tokens to your community</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Creator Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Launch your verified social token with milestone-based tokenomics
            </p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Setup Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {steps.map((step) => (
                  <Badge 
                    key={step.id}
                    variant={
                      step.status === 'completed' ? 'default' :
                      step.status === 'in-progress' ? 'secondary' :
                      step.status === 'error' ? 'destructive' :
                      'outline'
                    }
                  >
                    {step.title}
                  </Badge>
                ))}
              </div>
              <Progress 
                value={(steps.filter(s => s.status === 'completed').length / steps.length) * 100} 
                className="h-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                {steps.filter(s => s.status === 'completed').length} of {steps.length} steps completed
              </p>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs defaultValue="setup" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              <div className="grid gap-6">
                {steps.map(getStepComponent)}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {insightIQProfile && (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500">Followers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{InsightIQHelpers.formatFollowerCount(insightIQProfile.followers)}</div>
                        <p className="text-xs text-gray-500 mt-1">
                          {InsightIQHelpers.getCreatorTier(insightIQProfile.followers)} influencer
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500">Engagement Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{insightIQProfile.engagementRate.toFixed(1)}%</div>
                        <p className="text-xs text-gray-500 mt-1">Above average</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500">Influence Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{Math.floor(insightIQProfile.influenceScore)}/100</div>
                        <Progress value={insightIQProfile.influenceScore} className="mt-2" />
                      </CardContent>
                    </Card>
                  </>
                )}

                {tokenMetrics && (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500">Token Supply</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{tokenMetrics.totalSupply.toString()}</div>
                        <p className="text-xs text-gray-500 mt-1">{tokenConfig.symbol} tokens</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500">Minting Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{tokenMetrics.tokensPerFollower.toString()}</div>
                        <p className="text-xs text-gray-500 mt-1">tokens per follower</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500">Last Update</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{tokenMetrics.lastFollowerCount.toString()}</div>
                        <p className="text-xs text-gray-500 mt-1">followers tracked</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reward Campaigns</CardTitle>
                    <CardDescription>
                      Distribute tokens to your community members based on engagement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {campaignIds.length > 0 ? (
                      <div className="space-y-4">
                        {campaignIds.map((campaignId) => (
                          <div key={campaignId} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">Campaign #{campaignId}</h4>
                                <p className="text-sm text-gray-500">Welcome Campaign</p>
                              </div>
                              <Badge>Active</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No reward campaigns yet</p>
                        <p className="text-sm text-gray-400">Complete the setup to create your first campaign</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Token Settings</CardTitle>
                  <CardDescription>
                    Manage your token parameters and oracle settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Automatic Minting</p>
                        <p className="text-sm text-gray-500">Tokens are minted when followers increase</p>
                      </div>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Oracle Updates</p>
                        <p className="text-sm text-gray-500">Automated follower count updates from InsightIQ</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}