import { createPublicClient, createWalletClient, http } from "viem"
import { arbitrum, arbitrumSepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

// Chain configuration
export const supportedChains = [arbitrum, arbitrumSepolia]
export const defaultChain = arbitrumSepolia

// Public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: defaultChain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || defaultChain.rpcUrls.default.http[0]),
})

// Wallet client for transactions (server-side)
export const getWalletClient = () => {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY
  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY not configured")
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`)

  return createWalletClient({
    account,
    chain: defaultChain,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || defaultChain.rpcUrls.default.http[0]),
  })
}

// Contract addresses
export const CONTRACT_ADDRESSES = {
  SOCIAL_TOKEN_FACTORY: process.env.SOCIAL_TOKEN_FACTORY_ADDRESS || "0x1234567890123456789012345678901234567890",
  MODULAR_TOKEN_IMPL: process.env.MODULAR_TOKEN_IMPL_ADDRESS || "0x2345678901234567890123456789012345678901",
}

// Web3 utilities
export const web3Utils = {
  // Format address for display
  formatAddress: (address: string, chars = 4) => {
    if (!address) return ""
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
  },

  // Validate Ethereum address
  isValidAddress: (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },

  // Convert Wei to Ether
  weiToEther: (wei: bigint) => {
    return Number(wei) / 1e18
  },

  // Convert Ether to Wei
  etherToWei: (ether: number) => {
    return BigInt(Math.floor(ether * 1e18))
  },

  // Get transaction receipt
  async getTransactionReceipt(hash: string) {
    try {
      return await publicClient.getTransactionReceipt({ hash: hash as `0x${string}` })
    } catch (error) {
      console.error("Error getting transaction receipt:", error)
      return null
    }
  },

  // Get block number
  async getBlockNumber() {
    try {
      return await publicClient.getBlockNumber()
    } catch (error) {
      console.error("Error getting block number:", error)
      return 0n
    }
  },

  // Get balance
  async getBalance(address: string) {
    try {
      return await publicClient.getBalance({ address: address as `0x${string}` })
    } catch (error) {
      console.error("Error getting balance:", error)
      return 0n
    }
  },

  // Estimate gas
  async estimateGas(transaction: any) {
    try {
      return await publicClient.estimateGas(transaction)
    } catch (error) {
      console.error("Error estimating gas:", error)
      return 21000n
    }
  },

  // Get gas price
  async getGasPrice() {
    try {
      return await publicClient.getGasPrice()
    } catch (error) {
      console.error("Error getting gas price:", error)
      return 1000000000n // 1 gwei fallback
    }
  },
}

// Token contract interactions
export const tokenContract = {
  // Deploy a new social token
  async deploySocialToken(params: {
    name: string
    symbol: string
    totalSupply: bigint
    creator: string
    metrics: string[]
    thresholds: number[]
    weights: number[]
  }) {
    try {
      const walletClient = getWalletClient()

      // Mock deployment for development
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
      const mockContractAddress = `0x${Math.random().toString(16).substr(2, 40)}`

      console.log("Mock token deployment:", {
        ...params,
        txHash: mockTxHash,
        contractAddress: mockContractAddress,
      })

      return {
        hash: mockTxHash,
        contractAddress: mockContractAddress,
        success: true,
      }
    } catch (error) {
      console.error("Error deploying social token:", error)
      throw error
    }
  },

  // Get token information
  async getTokenInfo(contractAddress: string) {
    try {
      // Mock token info for development
      return {
        name: "Mock Token",
        symbol: "MOCK",
        totalSupply: 1000000n,
        decimals: 18,
        owner: "0x1234567890123456789012345678901234567890",
      }
    } catch (error) {
      console.error("Error getting token info:", error)
      return null
    }
  },

  // Get token balance
  async getTokenBalance(contractAddress: string, userAddress: string) {
    try {
      // Mock balance for development
      return 1000n
    } catch (error) {
      console.error("Error getting token balance:", error)
      return 0n
    }
  },

  // Transfer tokens
  async transferTokens(contractAddress: string, to: string, amount: bigint) {
    try {
      const walletClient = getWalletClient()

      // Mock transfer for development
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`

      console.log("Mock token transfer:", {
        contractAddress,
        to,
        amount: amount.toString(),
        txHash: mockTxHash,
      })

      return {
        hash: mockTxHash,
        success: true,
      }
    } catch (error) {
      console.error("Error transferring tokens:", error)
      throw error
    }
  },
}

export default web3Utils
