import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { arbitrum } from "thirdweb/chains";

// Thirdweb client configuration
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Chain configuration
export const chain = arbitrum;

// Factory contract configuration
export const factoryContract = getContract({
  client,
  chain,
  address: process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS!,
});

// Contract ABIs
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

export const FACTORY_ABI = [
  "function createToken(string memory name, string memory symbol, uint256 initialSupply, address creator) returns (address)",
  "function getTokensByCreator(address creator) view returns (address[])",
  "function tokenCount() view returns (uint256)",
  "function tokens(uint256 index) view returns (address)",
  "event TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol)",
];

// Token creation parameters interface
export interface TokenCreationParams {
  name: string;
  symbol: string;
  description?: string;
  logoUrl?: string;
  initialSupply: bigint;
  maxSupply?: bigint;
  mintingRule: 'manual' | 'per_follower' | 'milestone';
  mintAmount: bigint;
}

// Milestone interface
export interface Milestone {
  title: string;
  description?: string;
  type: 'followers' | 'posts' | 'engagement' | 'custom';
  target: bigint;
  rewardAmount: bigint;
  rewardType: 'token' | 'nft' | 'custom';
}

// Social media metrics interface
export interface SocialMetrics {
  followers: number;
  following: number;
  posts: number;
  engagement: number;
  verified: boolean;
}

// Utility functions
export const formatTokenAmount = (amount: bigint, decimals: number = 18): string => {
  const divisor = BigInt(10 ** decimals);
  const quotient = amount / divisor;
  const remainder = amount % divisor;
  
  if (remainder === 0n) {
    return quotient.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmedRemainder = remainderStr.replace(/0+$/, '');
  
  return trimmedRemainder ? `${quotient}.${trimmedRemainder}` : quotient.toString();
};

export const parseTokenAmount = (amount: string, decimals: number = 18): bigint => {
  const [whole, fractional = ''] = amount.split('.');
  const wholePart = BigInt(whole || '0');
  
  if (!fractional) {
    return wholePart * BigInt(10 ** decimals);
  }
  
  const fractionalPart = fractional.padEnd(decimals, '0').slice(0, decimals);
  return wholePart * BigInt(10 ** decimals) + BigInt(fractionalPart);
};

export const shortenAddress = (address: string, chars: number = 4): string => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const formatTransactionHash = (hash: string): string => {
  return shortenAddress(hash, 6);
};

// Validation functions
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidTokenSymbol = (symbol: string): boolean => {
  return /^[A-Z]{1,11}$/.test(symbol);
};

export const isValidTokenName = (name: string): boolean => {
  return name.length >= 1 && name.length <= 50;
};

// Error handling
export class Web3Error extends Error {
  constructor(message: string, public code?: string, public data?: any) {
    super(message);
    this.name = 'Web3Error';
  }
}

export const handleWeb3Error = (error: any): Web3Error => {
  console.error('Web3 Error:', error);
  
  if (error.code === 4001) {
    return new Web3Error('Transaction rejected by user', 'USER_REJECTED');
  }
  
  if (error.code === -32602) {
    return new Web3Error('Invalid parameters', 'INVALID_PARAMS');
  }
  
  if (error.message?.includes('insufficient funds')) {
    return new Web3Error('Insufficient funds for transaction', 'INSUFFICIENT_FUNDS');
  }
  
  if (error.message?.includes('gas')) {
    return new Web3Error('Gas estimation failed', 'GAS_ERROR');
  }
  
  return new Web3Error(error.message || 'Unknown Web3 error', 'UNKNOWN_ERROR');
};

// Constants
export const SUPPORTED_CHAINS = [arbitrum];

export const CHAIN_EXPLORERS = {
  [arbitrum.id]: 'https://arbiscan.io',
};

export const RPC_URLS = {
  [arbitrum.id]: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
};

export const NATIVE_CURRENCY = {
  [arbitrum.id]: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Contract interaction helpers
export const getTokenBalance = async (
  tokenAddress: string,
  userAddress: string
): Promise<bigint> => {
  try {
    const tokenContract = getContract({
      client,
      chain,
      address: tokenAddress,
    });
    
    // This would be implemented with actual contract calls
    // For now, returning a placeholder
    return BigInt(0);
  } catch (error) {
    throw handleWeb3Error(error);
  }
};

export const getTokenMetadata = async (tokenAddress: string) => {
  try {
    const tokenContract = getContract({
      client,
      chain,
      address: tokenAddress,
    });
    
    // This would be implemented with actual contract calls
    // For now, returning a placeholder
    return {
      name: '',
      symbol: '',
      decimals: 18,
      totalSupply: BigInt(0),
    };
  } catch (error) {
    throw handleWeb3Error(error);
  }
};

// Local storage helpers for caching
export const getCachedTokenData = (tokenAddress: string) => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(`token_${tokenAddress}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export const setCachedTokenData = (tokenAddress: string, data: any) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`token_${tokenAddress}`, JSON.stringify({
      ...data,
      cachedAt: Date.now(),
    }));
  } catch {
    // Ignore localStorage errors
  }
};

export const isCacheValid = (cachedData: any, maxAge: number = 5 * 60 * 1000): boolean => {
  return cachedData && cachedData.cachedAt && (Date.now() - cachedData.cachedAt) < maxAge;
};