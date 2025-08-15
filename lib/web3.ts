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

// Updated Chain configuration for custom Arbitrum
export const chain = {
  id: 150179125,
  name: "Custom Arbitrum",
  network: "arbitrum-custom",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    public: { http: [process.env.NEXT_PUBLIC_CUSTOM_ARB_RPC_URL || ""] },
    default: { http: [process.env.NEXT_PUBLIC_CUSTOM_ARB_RPC_URL || ""] },
  },
}

// Updated contract addresses from deployment
export const TOKEN_FACTORY_ADDRESS = "0x477B1D346a477FD3190da45c29F226f33D09Dc93"
export const SAMPLE_TOKEN_ADDRESS = "0x7f2BFF3ecF09B430f01271A892b1dB4C533F568E"

// Factory contract configuration - only if client is available
export const getFactoryContract = () => {
  if (!client) {
    throw new Error("Thirdweb client not initialized. Please check your environment variables.")
  }

  return getContract({
    client,
    chain,
    address: TOKEN_FACTORY_ADDRESS,
  })
}

// Updated Contract ABIs for TokenFactory and ModularToken
export const TOKEN_FACTORY_ABI = [
  "function deployToken(string memory name, string memory symbol, uint256 initialSupply, string[] memory metricNames, uint256[] memory thresholds, uint256[] memory multipliers, address creator, string memory creatorData) returns (address)",
  "function getTokensByCreator(address creator) view returns (address[])",
  "function getAllTokens() view returns (address[])",
  "function isValidToken(address token) view returns (bool)",
  "function owner() view returns (address)",
  "event TokenDeployed(address indexed tokenAddress, address indexed creator, string name, string symbol)",
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
  "function getMetricConfig() view returns (string[] memory, uint256[] memory, uint256[] memory)",
  "function updateMetrics(string[] memory names, uint256[] memory values) returns (bool)",
  "function claimRewards() returns (uint256)",
  "function getCreatorData() view returns (string memory)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event MetricsUpdated(string[] names, uint256[] values)",
  "event RewardsClaimed(address indexed creator, uint256 amount)",
]

// TypeScript interfaces for contract interactions
export interface MetricConfig {
  name: string;
  thresholds: number[];
  multipliers: number[];
}

export interface CreatorMetrics {
  followers: number;
  engagement_rate: number;
  reach: number;
  influence_score: number;
  authenticity_score: number;
  growth_rate: number;
}

export interface TokenDeploymentParams {
  name: string;
  symbol: string;
  initialSupply: bigint;
  metricNames: string[];
  thresholds: number[];
  multipliers: number[];
  creator: string;
  creatorData: string;
}

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

  // Updated contract interactions for new TokenFactory
  async deployToken(tokenData: {
    name: string
    symbol: string
    initialSupply: string
    metricNames: string[]
    thresholds: number[]
    multipliers: number[]
    creator: string
    creatorData: any
  }): Promise<{ contractAddress: string; transactionHash: string }> {
    try {
      const signer = await this.getSigner()
      const factory = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, signer)

      const initialSupplyWei = ethers.parseEther(tokenData.initialSupply)
      const creatorDataString = JSON.stringify(tokenData.creatorData)

      const tx = await factory.deployToken(
        tokenData.name,
        tokenData.symbol,
        initialSupplyWei,
        tokenData.metricNames,
        tokenData.thresholds,
        tokenData.multipliers,
        tokenData.creator,
        creatorDataString,
      )

      const receipt = await tx.wait()

      // Extract contract address from event logs
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log)
          return parsed?.name === "TokenDeployed"
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

      const [name, symbol, decimals, totalSupply, creator, metricConfig, creatorData] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
        token.creator(),
        token.getMetricConfig(),
        token.getCreatorData(),
      ])

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatEther(totalSupply),
        creator,
        contractAddress,
        creatorData: JSON.parse(creatorData),
        metrics: {
          names: metricConfig[0],
          thresholds: metricConfig[1].map((t: any) => Number(t)),
          multipliers: metricConfig[2].map((m: any) => Number(m)),
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

  async updateMetrics(contractAddress: string, names: string[], values: number[]): Promise<string> {
    try {
      const signer = await this.getSigner()
      const token = new ethers.Contract(contractAddress, MODULAR_TOKEN_ABI, signer)

      const tx = await token.updateMetrics(names, values)
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error("Update metrics error:", error)
      throw new Error("Failed to update metrics")
    }
  },

  async claimRewards(contractAddress: string): Promise<{ amount: string; transactionHash: string }> {
    try {
      const signer = await this.getSigner()
      const token = new ethers.Contract(contractAddress, MODULAR_TOKEN_ABI, signer)

      const tx = await token.claimRewards()
      const receipt = await tx.wait()

      // Get the reward amount from the event logs
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = token.interface.parseLog(log)
          return parsed?.name === "RewardsClaimed"
        } catch {
          return false
        }
      })

      let amount = "0"
      if (event) {
        const parsedEvent = token.interface.parseLog(event)
        amount = ethers.formatEther(parsedEvent?.args[1] || 0)
      }

      return {
        amount,
        transactionHash: receipt.hash,
      }
    } catch (error) {
      console.error("Claim rewards error:", error)
      throw new Error("Failed to claim rewards")
    }
  },

  // Factory contract interactions
  async getTokensByCreator(creator: string): Promise<string[]> {
    try {
      const provider = this.getProvider()
      const factory = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, provider)
      return await factory.getTokensByCreator(creator)
    } catch (error) {
      console.error("Get tokens by creator error:", error)
      throw new Error("Failed to get tokens by creator")
    }
  },

  async getAllTokens(): Promise<string[]> {
    try {
      const provider = this.getProvider()
      const factory = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, provider)
      return await factory.getAllTokens()
    } catch (error) {
      console.error("Get all tokens error:", error)
      throw new Error("Failed to get all tokens")
    }
  },

  async isValidToken(tokenAddress: string): Promise<boolean> {
    try {
      const provider = this.getProvider()
      const factory = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, provider)
      return await factory.isValidToken(tokenAddress)
    } catch (error) {
      console.error("Validate token error:", error)
      return false
    }
  },
}

export default Web3Utils
