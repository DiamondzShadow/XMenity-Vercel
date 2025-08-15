import { createThirdwebClient, getContract } from "thirdweb"
import { arbitrum } from "thirdweb/chains"
import { ethers } from "ethers"
import { isAddress } from "viem"

// Utility functions that can be used without client
export function isValidAddress(address: string): boolean {
  return isAddress(address)
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ""
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatTokenAmount(amount: string | number, decimals = 18): string {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  if (num === 0) return "0"

  if (num < 0.001) return "<0.001"
  if (num < 1) return num.toFixed(3)
  if (num < 1000) return num.toFixed(2)
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
  return `${(num / 1000000).toFixed(1)}M`
}

export function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? Number.parseFloat(price) : price
  if (num < 0.01) return `$${num.toFixed(4)}`
  return `$${num.toFixed(2)}`
}

export const parseTokenAmount = (amount: string, decimals = 18): bigint => {
  return ethers.parseUnits(amount, decimals)
}

// Thirdweb client configuration with fallback
let client: any = null

try {
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || process.env.THIRDWEB_CLIENT_ID
  const secretKey = process.env.THIRDWEB_SECRET_KEY

  if (clientId || secretKey) {
    client = createThirdwebClient({
      clientId: clientId || undefined,
      secretKey: secretKey || undefined,
    })
  }
} catch (error) {
  console.warn("Thirdweb client initialization failed:", error)
}

export { client }

// Chain configuration
export const chain = arbitrum

// Enhanced Social Token Factory Contract Address on Arbitrum One
export const MODULAR_TOKEN_FACTORY_ADDRESS = "0xEA3126464a541ff082F184Ca6cd7CE3aeF50c7b7"
export const MILESTONE_SOCIAL_TOKEN_FACTORY_ADDRESS = "0x742d35Cc6647C478a0a03B8bC20d486E0C3B0f5c"

// Factory contract configuration - only if client is available
export const getFactoryContract = () => {
  if (!client) {
    throw new Error("Thirdweb client not initialized. Please check your environment variables.")
  }

  return getContract({
    client,
    chain,
    address: MODULAR_TOKEN_FACTORY_ADDRESS,
  })
}

// Contract ABIs for Enhanced Social Token Factory
export const MODULAR_TOKEN_FACTORY_ABI = [
  "function deployModularToken(string memory name, string memory symbol, uint256 initialSupply, string[] memory metrics, uint256[] memory thresholds, uint256[] memory weights, address creator, bytes memory creatorData) returns (address)",
  "function getTokensByCreator(address creator) view returns (address[])",
  "function tokenCount() view returns (uint256)",
  "function tokens(uint256 index) view returns (address)",
  "function isValidToken(address token) view returns (bool)",
  "event ModularTokenDeployed(address indexed tokenAddress, address indexed creator, string name, string symbol, uint256 initialSupply)",
]

export const MILESTONE_SOCIAL_TOKEN_FACTORY_ABI = [
  "function createMilestoneSocialToken(string memory name, string memory symbol, uint256 totalSupply, uint256 initialPrice, address creator, uint256[] memory milestoneHolders, uint256[] memory milestoneRewards, uint256 rewardMultiplier) returns (address)",
  "function createSocialToken(string memory name, string memory symbol, uint256 totalSupply, address creator, uint256[] memory metrics, uint256[] memory thresholds, uint256[] memory weights) returns (address)",
  "function getTokensByCreator(address creator) view returns (address[])",
  "function getVerifiedTokens() view returns (address[])",
  "function tokenCount() view returns (uint256)",
  "function verifiedTokenCount() view returns (uint256)",
  "function tokens(uint256 index) view returns (address)",
  "function isValidToken(address token) view returns (bool)",
  "function isVerifiedToken(address token) view returns (bool)",
  "function upgradePlatform(address newImplementation) external",
  "event MilestoneSocialTokenDeployed(address indexed tokenAddress, address indexed creator, string name, string symbol, uint256 totalSupply, uint256 initialPrice)",
  "event SocialTokenDeployed(address indexed tokenAddress, address indexed creator, string name, string symbol, uint256 totalSupply)",
  "event TokenVerified(address indexed tokenAddress, address indexed creator, uint256 timestamp)",
  "event PlatformUpgraded(address indexed oldImplementation, address indexed newImplementation)",
]

export const MODULAR_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) returns (bool)",
  "function burn(uint256 amount) returns (bool)",
  "function creator() view returns (address)",
  "function getMetrics() view returns (string[] memory, uint256[] memory, uint256[] memory)",
  "function updateMetricValue(string memory metric, uint256 value) returns (bool)",
  "function claimReward() returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event MetricUpdated(string metric, uint256 oldValue, uint256 newValue)",
  "event RewardClaimed(address indexed creator, uint256 amount)",
]

export const MILESTONE_SOCIAL_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) returns (bool)",
  "function burn(uint256 amount) returns (bool)",
  "function creator() view returns (address)",
  "function currentPrice() view returns (uint256)",
  "function holdersCount() view returns (uint256)",
  "function getMilestones() view returns (uint256[] memory, uint256[] memory, bool[] memory)",
  "function getCurrentMilestone() view returns (uint256)",
  "function checkMilestoneProgress() returns (bool)",
  "function claimMilestoneReward(uint256 milestoneIndex) returns (bool)",
  "function updateHolderCount() external",
  "function setPrice(uint256 newPrice) external",
  "function isVerified() view returns (bool)",
  "function getInsightIQData() view returns (string memory, uint256, uint256, string memory)",
  "function updateInsightIQMetrics(uint256 followers, uint256 engagementRate, uint256 influenceScore) external",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event MilestoneAchieved(uint256 indexed milestoneIndex, uint256 holders, uint256 reward)",
  "event MilestoneRewardClaimed(address indexed creator, uint256 milestoneIndex, uint256 reward)",
  "event PriceUpdated(uint256 oldPrice, uint256 newPrice)",
  "event HolderCountUpdated(uint256 oldCount, uint256 newCount)",
  "event InsightIQMetricsUpdated(uint256 followers, uint256 engagementRate, uint256 influenceScore)",
]

// Web3 utility functions
export const Web3Utils = {
  // Provider setup
  getProvider(): ethers.BrowserProvider {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Ethereum provider not found. Please install MetaMask or another Web3 wallet.")
    }
    return new ethers.BrowserProvider(window.ethereum)
  },

  async getSigner(): Promise<ethers.JsonRpcSigner> {
    const provider = this.getProvider()
    return await provider.getSigner()
  },

  // Contract interactions
  async deployModularToken(tokenData: {
    name: string
    symbol: string
    initialSupply: string
    metrics: string[]
    thresholds: number[]
    weights: number[]
    creator: string
    creatorData: any
  }): Promise<{ contractAddress: string; transactionHash: string }> {
    try {
      const signer = await this.getSigner()
      const factory = new ethers.Contract(MODULAR_TOKEN_FACTORY_ADDRESS, MODULAR_TOKEN_FACTORY_ABI, signer)

      const initialSupplyWei = ethers.parseEther(tokenData.initialSupply)
      const creatorDataBytes = ethers.toUtf8Bytes(JSON.stringify(tokenData.creatorData))

      const tx = await factory.deployModularToken(
        tokenData.name,
        tokenData.symbol,
        initialSupplyWei,
        tokenData.metrics,
        tokenData.thresholds,
        tokenData.weights,
        tokenData.creator,
        creatorDataBytes,
      )

      const receipt = await tx.wait()

      // Extract contract address from event logs
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log)
          return parsed?.name === "ModularTokenDeployed"
        } catch {
          return false
        }
      })

      if (!event) {
        throw new Error("Token deployment event not found")
      }

      const parsedEvent = factory.interface.parseLog(event)
      const contractAddress = parsedEvent?.args[0]

      return {
        contractAddress,
        transactionHash: receipt.hash,
      }
    } catch (error) {
      console.error("Token deployment error:", error)
      throw new Error(`Failed to deploy token: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  async getTokenInfo(contractAddress: string): Promise<any> {
    try {
      const provider = this.getProvider()
      const token = new ethers.Contract(contractAddress, MODULAR_TOKEN_ABI, provider)

      const [name, symbol, decimals, totalSupply, creator, metrics] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
        token.creator(),
        token.getMetrics(),
      ])

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatEther(totalSupply),
        creator,
        contractAddress,
        metrics: {
          names: metrics[0],
          thresholds: metrics[1].map((t: any) => Number(t)),
          weights: metrics[2].map((w: any) => Number(w)),
        },
      }
    } catch (error) {
      console.error("Get token info error:", error)
      throw new Error("Failed to get token information")
    }
  },

  async getTokenBalance(contractAddress: string, userAddress: string): Promise<string> {
    try {
      const provider = this.getProvider()
      const token = new ethers.Contract(contractAddress, MODULAR_TOKEN_ABI, provider)
      const balance = await token.balanceOf(userAddress)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error("Get token balance error:", error)
      throw new Error("Failed to get token balance")
    }
  },

  async updateMetricValue(contractAddress: string, metric: string, value: number): Promise<string> {
    try {
      const signer = await this.getSigner()
      const token = new ethers.Contract(contractAddress, MODULAR_TOKEN_ABI, signer)

      const tx = await token.updateMetricValue(metric, value)
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error("Update metric error:", error)
      throw new Error("Failed to update metric value")
    }
  },

  async claimReward(contractAddress: string): Promise<string> {
    try {
      const signer = await this.getSigner()
      const token = new ethers.Contract(contractAddress, MODULAR_TOKEN_ABI, signer)

      const tx = await token.claimReward()
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error("Claim reward error:", error)
      throw new Error("Failed to claim reward")
    }
  },

  // Enhanced functions for Milestone Social Tokens
  async deployMilestoneSocialToken(tokenData: {
    name: string
    symbol: string
    totalSupply: string
    initialPrice: string
    creator: string
    milestoneHolders: number[]
    milestoneRewards: number[]
    rewardMultiplier: number
  }): Promise<{ contractAddress: string; transactionHash: string }> {
    try {
      const signer = await this.getSigner()
      const factory = new ethers.Contract(MILESTONE_SOCIAL_TOKEN_FACTORY_ADDRESS, MILESTONE_SOCIAL_TOKEN_FACTORY_ABI, signer)

      const totalSupplyWei = ethers.parseEther(tokenData.totalSupply)
      const initialPriceWei = ethers.parseEther(tokenData.initialPrice)
      const rewardsScaled = tokenData.milestoneRewards.map(r => Math.floor(r * 1000)) // Scale rewards

      const tx = await factory.createMilestoneSocialToken(
        tokenData.name,
        tokenData.symbol,
        totalSupplyWei,
        initialPriceWei,
        tokenData.creator,
        tokenData.milestoneHolders,
        rewardsScaled,
        tokenData.rewardMultiplier
      )

      const receipt = await tx.wait()

      // Extract contract address from event logs
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log)
          return parsed?.name === "MilestoneSocialTokenDeployed"
        } catch {
          return false
        }
      })

      if (!event) {
        throw new Error("Token deployment event not found")
      }

      const parsedEvent = factory.interface.parseLog(event)
      const contractAddress = parsedEvent?.args[0]

      return {
        contractAddress,
        transactionHash: receipt.hash,
      }
    } catch (error) {
      console.error("Milestone token deployment error:", error)
      throw new Error(`Failed to deploy milestone token: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },

  async getMilestoneTokenInfo(contractAddress: string): Promise<any> {
    try {
      const provider = this.getProvider()
      const token = new ethers.Contract(contractAddress, MILESTONE_SOCIAL_TOKEN_ABI, provider)

      const [name, symbol, decimals, totalSupply, creator, currentPrice, holdersCount, milestones, currentMilestone, isVerified] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
        token.creator(),
        token.currentPrice(),
        token.holdersCount(),
        token.getMilestones(),
        token.getCurrentMilestone(),
        token.isVerified(),
      ])

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatEther(totalSupply),
        creator,
        contractAddress,
        currentPrice: ethers.formatEther(currentPrice),
        holdersCount: Number(holdersCount),
        currentMilestone: Number(currentMilestone),
        isVerified,
        milestones: {
          holders: milestones[0].map((h: any) => Number(h)),
          rewards: milestones[1].map((r: any) => Number(r) / 1000), // Unscale rewards
          unlocked: milestones[2],
        },
      }
    } catch (error) {
      console.error("Get milestone token info error:", error)
      throw new Error("Failed to get milestone token information")
    }
  },

  async checkMilestoneProgress(contractAddress: string): Promise<string> {
    try {
      const signer = await this.getSigner()
      const token = new ethers.Contract(contractAddress, MILESTONE_SOCIAL_TOKEN_ABI, signer)

      const tx = await token.checkMilestoneProgress()
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error("Check milestone progress error:", error)
      throw new Error("Failed to check milestone progress")
    }
  },

  async claimMilestoneReward(contractAddress: string, milestoneIndex: number): Promise<string> {
    try {
      const signer = await this.getSigner()
      const token = new ethers.Contract(contractAddress, MILESTONE_SOCIAL_TOKEN_ABI, signer)

      const tx = await token.claimMilestoneReward(milestoneIndex)
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error("Claim milestone reward error:", error)
      throw new Error("Failed to claim milestone reward")
    }
  },

  async updateInsightIQMetrics(contractAddress: string, followers: number, engagementRate: number, influenceScore: number): Promise<string> {
    try {
      const signer = await this.getSigner()
      const token = new ethers.Contract(contractAddress, MILESTONE_SOCIAL_TOKEN_ABI, signer)

      const engagementRateScaled = Math.floor(engagementRate * 10000) // Scale to basis points

      const tx = await token.updateInsightIQMetrics(followers, engagementRateScaled, influenceScore)
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error("Update InsightIQ metrics error:", error)
      throw new Error("Failed to update InsightIQ metrics")
    }
  },

  async getVerifiedTokens(): Promise<string[]> {
    try {
      const provider = this.getProvider()
      const factory = new ethers.Contract(MILESTONE_SOCIAL_TOKEN_FACTORY_ADDRESS, MILESTONE_SOCIAL_TOKEN_FACTORY_ABI, provider)

      const verifiedTokens = await factory.getVerifiedTokens()
      return verifiedTokens
    } catch (error) {
      console.error("Get verified tokens error:", error)
      throw new Error("Failed to get verified tokens")
    }
  },

  async getTokensByCreator(creatorAddress: string, useEnhancedFactory: boolean = true): Promise<string[]> {
    try {
      const provider = this.getProvider()
      const factoryAddress = useEnhancedFactory ? MILESTONE_SOCIAL_TOKEN_FACTORY_ADDRESS : MODULAR_TOKEN_FACTORY_ADDRESS
      const factoryABI = useEnhancedFactory ? MILESTONE_SOCIAL_TOKEN_FACTORY_ABI : MODULAR_TOKEN_FACTORY_ABI
      
      const factory = new ethers.Contract(factoryAddress, factoryABI, provider)

      const tokens = await factory.getTokensByCreator(creatorAddress)
      return tokens
    } catch (error) {
      console.error("Get tokens by creator error:", error)
      throw new Error("Failed to get tokens by creator")
    }
  },
}

export default Web3Utils
