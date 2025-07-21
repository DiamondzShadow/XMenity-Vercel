import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface WalletXBinding {
  id: string;
  platformUserId: string;
  platformUsername: string;
  walletAddress: string;
  dateLinked: Date;
  minted: boolean;
  lastMintAt?: Date;
  extraMetadata?: any;
  isActive: boolean;
}

export interface BindingCreateParams {
  platformUserId: string;
  platformUsername: string;
  walletAddress: string;
  extraMetadata?: any;
}

export interface BindingUpdateParams {
  minted?: boolean;
  lastMintAt?: Date;
  extraMetadata?: any;
  isActive?: boolean;
}

export class WalletBindingService {
  private static instance: WalletBindingService;

  private constructor() {}

  public static getInstance(): WalletBindingService {
    if (!WalletBindingService.instance) {
      WalletBindingService.instance = new WalletBindingService();
    }
    return WalletBindingService.instance;
  }

  /**
   * Create a new wallet-X account binding
   */
  async createBinding(params: BindingCreateParams): Promise<WalletXBinding> {
    try {
      // Check if binding already exists
      const existing = await this.getBinding(
        params.platformUserId,
        params.walletAddress
      );

      if (existing) {
        throw new Error('Binding already exists for this platform user and wallet');
      }

      const binding = await prisma.walletXBinding.create({
        data: {
          id: uuidv4(),
          platformUserId: params.platformUserId,
          platformUsername: params.platformUsername,
          walletAddress: params.walletAddress.toLowerCase(),
          dateLinked: new Date(),
          minted: false,
          extraMetadata: params.extraMetadata || {},
          isActive: true,
        },
      });

      return binding;
    } catch (error) {
      console.error('Error creating wallet binding:', error);
      throw error;
    }
  }

  /**
   * Get binding by platform user ID and wallet address
   */
  async getBinding(
    platformUserId: string,
    walletAddress: string
  ): Promise<WalletXBinding | null> {
    try {
      const binding = await prisma.walletXBinding.findFirst({
        where: {
          platformUserId,
          walletAddress: walletAddress.toLowerCase(),
          isActive: true,
        },
      });

      return binding;
    } catch (error) {
      console.error('Error getting wallet binding:', error);
      return null;
    }
  }

  /**
   * Get all bindings for a wallet address
   */
  async getBindingsByWallet(walletAddress: string): Promise<WalletXBinding[]> {
    try {
      const bindings = await prisma.walletXBinding.findMany({
        where: {
          walletAddress: walletAddress.toLowerCase(),
          isActive: true,
        },
        orderBy: {
          dateLinked: 'desc',
        },
      });

      return bindings;
    } catch (error) {
      console.error('Error getting bindings by wallet:', error);
      return [];
    }
  }

  /**
   * Get all bindings for a platform user
   */
  async getBindingsByPlatformUser(platformUserId: string): Promise<WalletXBinding[]> {
    try {
      const bindings = await prisma.walletXBinding.findMany({
        where: {
          platformUserId,
          isActive: true,
        },
        orderBy: {
          dateLinked: 'desc',
        },
      });

      return bindings;
    } catch (error) {
      console.error('Error getting bindings by platform user:', error);
      return [];
    }
  }

  /**
   * Update a binding
   */
  async updateBinding(
    platformUserId: string,
    walletAddress: string,
    updates: BindingUpdateParams
  ): Promise<WalletXBinding | null> {
    try {
      const binding = await prisma.walletXBinding.updateMany({
        where: {
          platformUserId,
          walletAddress: walletAddress.toLowerCase(),
          isActive: true,
        },
        data: {
          ...updates,
          ...(updates.minted && { lastMintAt: new Date() }),
        },
      });

      if (binding.count === 0) {
        return null;
      }

      // Return the updated binding
      return await this.getBinding(platformUserId, walletAddress);
    } catch (error) {
      console.error('Error updating wallet binding:', error);
      return null;
    }
  }

  /**
   * Check if a user has already minted for a specific wallet
   */
  async hasUserMinted(
    platformUserId: string,
    walletAddress: string
  ): Promise<boolean> {
    try {
      const binding = await this.getBinding(platformUserId, walletAddress);
      return binding?.minted || false;
    } catch (error) {
      console.error('Error checking if user minted:', error);
      return false;
    }
  }

  /**
   * Mark a binding as minted
   */
  async markAsMinted(
    platformUserId: string,
    walletAddress: string,
    extraMetadata?: any
  ): Promise<boolean> {
    try {
      const result = await this.updateBinding(
        platformUserId,
        walletAddress,
        {
          minted: true,
          extraMetadata,
        }
      );

      return result !== null;
    } catch (error) {
      console.error('Error marking as minted:', error);
      return false;
    }
  }

  /**
   * Deactivate a binding (soft delete)
   */
  async deactivateBinding(
    platformUserId: string,
    walletAddress: string
  ): Promise<boolean> {
    try {
      const result = await this.updateBinding(
        platformUserId,
        walletAddress,
        {
          isActive: false,
        }
      );

      return result !== null;
    } catch (error) {
      console.error('Error deactivating binding:', error);
      return false;
    }
  }

  /**
   * Get all minted bindings
   */
  async getMintedBindings(): Promise<WalletXBinding[]> {
    try {
      const bindings = await prisma.walletXBinding.findMany({
        where: {
          minted: true,
          isActive: true,
        },
        orderBy: {
          lastMintAt: 'desc',
        },
      });

      return bindings;
    } catch (error) {
      console.error('Error getting minted bindings:', error);
      return [];
    }
  }

  /**
   * Get bindings created within a time range
   */
  async getBindingsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<WalletXBinding[]> {
    try {
      const bindings = await prisma.walletXBinding.findMany({
        where: {
          dateLinked: {
            gte: startDate,
            lte: endDate,
          },
          isActive: true,
        },
        orderBy: {
          dateLinked: 'desc',
        },
      });

      return bindings;
    } catch (error) {
      console.error('Error getting bindings by date range:', error);
      return [];
    }
  }

  /**
   * Get statistics about bindings
   */
  async getBindingStats() {
    try {
      const [
        totalBindings,
        mintedBindings,
        uniqueWallets,
        uniquePlatformUsers,
        recentBindings,
      ] = await Promise.all([
        prisma.walletXBinding.count({
          where: { isActive: true },
        }),
        prisma.walletXBinding.count({
          where: { minted: true, isActive: true },
        }),
        prisma.walletXBinding.groupBy({
          by: ['walletAddress'],
          where: { isActive: true },
        }),
        prisma.walletXBinding.groupBy({
          by: ['platformUserId'],
          where: { isActive: true },
        }),
        prisma.walletXBinding.count({
          where: {
            dateLinked: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
            isActive: true,
          },
        }),
      ]);

      return {
        totalBindings,
        mintedBindings,
        uniqueWallets: uniqueWallets.length,
        uniquePlatformUsers: uniquePlatformUsers.length,
        recentBindings,
        mintingRate: totalBindings > 0 ? (mintedBindings / totalBindings) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting binding stats:', error);
      return {
        totalBindings: 0,
        mintedBindings: 0,
        uniqueWallets: 0,
        uniquePlatformUsers: 0,
        recentBindings: 0,
        mintingRate: 0,
      };
    }
  }

  /**
   * Cleanup old inactive bindings
   */
  async cleanupInactiveBindings(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      const result = await prisma.walletXBinding.deleteMany({
        where: {
          isActive: false,
          dateLinked: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Cleaned up ${result.count} inactive bindings older than ${olderThanDays} days`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up inactive bindings:', error);
      return 0;
    }
  }

  /**
   * Validate wallet address format
   */
  private isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Search bindings by username pattern
   */
  async searchBindingsByUsername(pattern: string): Promise<WalletXBinding[]> {
    try {
      const bindings = await prisma.walletXBinding.findMany({
        where: {
          platformUsername: {
            contains: pattern,
            mode: 'insensitive',
          },
          isActive: true,
        },
        orderBy: {
          dateLinked: 'desc',
        },
        take: 50, // Limit results
      });

      return bindings;
    } catch (error) {
      console.error('Error searching bindings by username:', error);
      return [];
    }
  }
}

export const walletBindingService = WalletBindingService.getInstance();