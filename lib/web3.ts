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

export const parseTokenAmount = (amount: string, decimals = 18): any => {
  return ethers.utils.parseUnits(amount, decimals)
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

// Modular Token Factory Contract Address on Arbitrum One
export const MODULAR_TOKEN_FACTORY_ADDRESS = "0xEA3126464a541ff082F184Ca6cd7CE3aeF50c7b7"

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

// Contract ABIs for Modular Token Factory
export const MODULAR_TOKEN_FACTORY_ABI = [
  "function deployModularToken(string memory name, string memory symbol, uint256 initialSupply, string[] memory metrics, uint256[] memory thresholds, uint256[] memory weights, address creator, bytes memory creatorData) returns (address)",
  "function getTokensByCreator(address creator) view returns (address[])",
  "function tokenCount() view returns (uint256)",
  "function tokens(uint256 index) view returns (address)",
  "function isValidToken(address token) view returns (bool)",
  "event ModularTokenDeployed(address indexed tokenAddress, address indexed creator, string name, string symbol, uint256 initialSupply)",
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
}

export default Web3Utils
