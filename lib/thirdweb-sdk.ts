import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Arbitrum } from "@thirdweb-dev/chains";
import { ethers } from "ethers";

// Types for contract interactions
export interface TokenConfig {
  name: string;
  symbol: string;
  tokensPerFollower: string;
  tokensPerPost: string;
  maxSupply: string;
}

export interface MintParams {
  to: string;
  amount: string;
  milestoneId?: number;
}

export interface CreatorData {
  isVerified: boolean;
  handle: string;
  platform: string;
  initialFollowers: number;
  tokenAddress?: string;
}

export class ThirdwebService {
  private static instance: ThirdwebService;
  private sdk: ThirdwebSDK | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): ThirdwebService {
    if (!ThirdwebService.instance) {
      ThirdwebService.instance = new ThirdwebService();
    }
    return ThirdwebService.instance;
  }

  /**
   * Initialize SDK with provider
   */
  async initialize(signer?: ethers.Signer): Promise<void> {
    try {
      if (signer) {
        // Initialize with connected wallet signer
        this.sdk = ThirdwebSDK.fromSigner(signer, Arbitrum, {
          clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
        });
      } else {
        // Initialize read-only with RPC
        this.sdk = new ThirdwebSDK(Arbitrum, {
          clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
        });
      }
      
      this.isInitialized = true;
      console.log("Thirdweb SDK initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Thirdweb SDK:", error);
      throw error;
    }
  }

  /**
   * Get SDK instance (initialize if needed)
   */
  async getSDK(signer?: ethers.Signer): Promise<ThirdwebSDK> {
    if (!this.isInitialized || !this.sdk) {
      await this.initialize(signer);
    }
    
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }
    
    return this.sdk;
  }

  /**
   * Deploy a new social token for a creator
   */
  async deployCreatorToken(
    config: TokenConfig,
    creatorAddress: string,
    signer: ethers.Signer
  ): Promise<string> {
    try {
      const sdk = await this.getSDK(signer);
      
      // Get the factory contract
      const factoryAddress = process.env.NEXT_PUBLIC_SOCIAL_TOKEN_FACTORY_ADDRESS;
      if (!factoryAddress) {
        throw new Error("Factory contract address not configured");
      }

      const factory = await sdk.getContract(factoryAddress);
      
      // Prepare transaction
      const tx = await factory.call("createToken", [
        {
          name: config.name,
          symbol: config.symbol,
          tokensPerFollower: ethers.utils.parseEther(config.tokensPerFollower),
          tokensPerPost: ethers.utils.parseEther(config.tokensPerPost),
          maxSupply: config.maxSupply === "0" ? 0 : ethers.utils.parseEther(config.maxSupply)
        }
      ], {
        value: ethers.utils.parseEther("0.001") // Deployment fee
      });

      console.log("Token deployment transaction:", tx.receipt.transactionHash);
      
      // Get the deployed token address from events
      const events = tx.receipt.events || [];
      const tokenCreatedEvent = events.find(e => e.event === "TokenCreated");
      
      if (!tokenCreatedEvent) {
        throw new Error("TokenCreated event not found");
      }

      const tokenAddress = tokenCreatedEvent.args[1]; // tokenAddr is second argument
      console.log("New token deployed at:", tokenAddress);
      
      return tokenAddress;
    } catch (error) {
      console.error("Error deploying creator token:", error);
      throw error;
    }
  }

  /**
   * Mint tokens to a specific address (Oracle function)
   */
  async mintTokens(
    tokenAddress: string,
    params: MintParams,
    signer: ethers.Signer
  ): Promise<string> {
    try {
      const sdk = await this.getSDK(signer);
      const tokenContract = await sdk.getContract(tokenAddress);
      
      // Call mintForMilestone if milestoneId provided, otherwise regular mint
      const tx = params.milestoneId !== undefined
        ? await tokenContract.call("mintForMilestone", [
            params.milestoneId,
            params.to,
            ethers.utils.parseEther(params.amount)
          ])
        : await tokenContract.call("mint", [
            params.to,
            ethers.utils.parseEther(params.amount)
          ]);
      
      console.log("Mint transaction:", tx.receipt.transactionHash);
      return tx.receipt.transactionHash;
    } catch (error) {
      console.error("Error minting tokens:", error);
      throw error;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string) {
    try {
      const sdk = await this.getSDK();
      const tokenContract = await sdk.getContract(tokenAddress);
      
      const [name, symbol, totalSupply, decimals] = await Promise.all([
        tokenContract.call("name"),
        tokenContract.call("symbol"),
        tokenContract.call("totalSupply"),
        tokenContract.call("decimals")
      ]);
      
      return {
        name,
        symbol,
        totalSupply: ethers.utils.formatEther(totalSupply),
        decimals: decimals.toString(),
        address: tokenAddress
      };
    } catch (error) {
      console.error("Error getting token info:", error);
      throw error;
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(tokenAddress: string, holderAddress: string): Promise<string> {
    try {
      const sdk = await this.getSDK();
      const tokenContract = await sdk.getContract(tokenAddress);
      
      const balance = await tokenContract.call("balanceOf", [holderAddress]);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error("Error getting token balance:", error);
      return "0";
    }
  }

  /**
   * Get creator's token address from factory
   */
  async getCreatorTokenAddress(creatorAddress: string): Promise<string | null> {
    try {
      const sdk = await this.getSDK();
      const factoryAddress = process.env.NEXT_PUBLIC_SOCIAL_TOKEN_FACTORY_ADDRESS;
      if (!factoryAddress) return null;

      const factory = await sdk.getContract(factoryAddress);
      const tokenAddress = await factory.call("getCreatorToken", [creatorAddress]);
      
      return tokenAddress === ethers.constants.AddressZero ? null : tokenAddress;
    } catch (error) {
      console.error("Error getting creator token address:", error);
      return null;
    }
  }

  /**
   * Check if creator is verified
   */
  async isCreatorVerified(creatorAddress: string): Promise<boolean> {
    try {
      const sdk = await this.getSDK();
      const factoryAddress = process.env.NEXT_PUBLIC_SOCIAL_TOKEN_FACTORY_ADDRESS;
      if (!factoryAddress) return false;

      const factory = await sdk.getContract(factoryAddress);
      const result = await factory.call("getVerifiedCreatorStatus", [creatorAddress]);
      
      return result.isVerified || false;
    } catch (error) {
      console.error("Error checking creator verification:", error);
      return false;
    }
  }

  /**
   * Transfer tokens between addresses
   */
  async transferTokens(
    tokenAddress: string,
    to: string,
    amount: string,
    signer: ethers.Signer
  ): Promise<string> {
    try {
      const sdk = await this.getSDK(signer);
      const tokenContract = await sdk.getContract(tokenAddress);
      
      const tx = await tokenContract.call("transfer", [
        to,
        ethers.utils.parseEther(amount)
      ]);
      
      console.log("Transfer transaction:", tx.receipt.transactionHash);
      return tx.receipt.transactionHash;
    } catch (error) {
      console.error("Error transferring tokens:", error);
      throw error;
    }
  }

  /**
   * Batch transfer tokens to multiple recipients
   */
  async batchTransferTokens(
    tokenAddress: string,
    recipients: Array<{ address: string; amount: string }>,
    signer: ethers.Signer
  ): Promise<string[]> {
    try {
      const sdk = await this.getSDK(signer);
      const tokenContract = await sdk.getContract(tokenAddress);
      
      const txHashes: string[] = [];
      
      // Execute transfers in sequence to avoid nonce issues
      for (const recipient of recipients) {
        const tx = await tokenContract.call("transfer", [
          recipient.address,
          ethers.utils.parseEther(recipient.amount)
        ]);
        
        txHashes.push(tx.receipt.transactionHash);
        console.log(`Transfer to ${recipient.address}:`, tx.receipt.transactionHash);
      }
      
      return txHashes;
    } catch (error) {
      console.error("Error in batch transfer:", error);
      throw error;
    }
  }

  /**
   * Get token metrics (custom function from CreatorToken contract)
   */
  async getTokenMetrics(tokenAddress: string) {
    try {
      const sdk = await this.getSDK();
      const tokenContract = await sdk.getContract(tokenAddress);
      
      const metrics = await tokenContract.call("getTokenMetrics");
      
      return {
        totalSupply: ethers.utils.formatEther(metrics.totalSupply),
        lastFollowerCount: metrics.lastFollowerCount.toString(),
        lastPostCount: metrics.lastPostCount.toString(),
        tokensPerFollower: ethers.utils.formatEther(metrics.tokensPerFollower),
        tokensPerPost: ethers.utils.formatEther(metrics.tokensPerPost)
      };
    } catch (error) {
      console.error("Error getting token metrics:", error);
      throw error;
    }
  }

  /**
   * Deploy a creator wallet (smart contract wallet)
   */
  async deployCreatorWallet(signer: ethers.Signer): Promise<string> {
    try {
      const sdk = await this.getSDK(signer);
      const walletFactoryAddress = process.env.NEXT_PUBLIC_CREATOR_WALLET_FACTORY_ADDRESS;
      
      if (!walletFactoryAddress) {
        throw new Error("Wallet factory address not configured");
      }

      const factory = await sdk.getContract(walletFactoryAddress);
      
      const tx = await factory.call("createWallet");
      console.log("Wallet deployment transaction:", tx.receipt.transactionHash);
      
      // Get the deployed wallet address from events
      const events = tx.receipt.events || [];
      const walletDeployedEvent = events.find(e => e.event === "WalletDeployed");
      
      if (!walletDeployedEvent) {
        throw new Error("WalletDeployed event not found");
      }

      const walletAddress = walletDeployedEvent.args[1]; // walletAddress is second argument
      console.log("New wallet deployed at:", walletAddress);
      
      return walletAddress;
    } catch (error) {
      console.error("Error deploying creator wallet:", error);
      throw error;
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      chainId: Arbitrum.chainId,
      name: Arbitrum.name,
      rpcUrl: Arbitrum.rpc[0],
      blockExplorer: Arbitrum.explorers?.[0]?.url
    };
  }
}

export const thirdwebService = ThirdwebService.getInstance();