import { SupabaseService, WalletXBinding, WalletXBindingInsert } from './supabase';
import { v4 as uuidv4 } from 'uuid';

const supabaseService = SupabaseService.getInstance();

// Re-export types from Supabase
export type { WalletXBinding, WalletXBindingInsert } from './supabase';

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
   * Create a new wallet binding
   */
  async createBinding(params: BindingCreateParams): Promise<WalletXBinding> {
    try {
      const binding = await supabaseService.createWalletBinding({
        platform_user_id: params.platformUserId,
        platform_username: params.platformUsername,
        wallet_address: params.walletAddress.toLowerCase(),
        extra_metadata: params.extraMetadata || {},
      });

      return binding;
    } catch (error) {
      console.error('Error creating wallet binding:', error);
      throw error;
    }
  }

  /**
   * Get bindings by platform user ID
   */
  async getBindingsByPlatformUser(platformUserId: string): Promise<WalletXBinding[]> {
    try {
      return await supabaseService.getWalletBindings(platformUserId);
    } catch (error) {
      console.error('Error getting bindings by platform user:', error);
      throw error;
    }
  }

  /**
   * Get bindings by wallet address
   */
  async getBindingsByWallet(walletAddress: string): Promise<WalletXBinding[]> {
    try {
      const { supabaseAdmin } = await import('./supabase');
      const { data, error } = await supabaseAdmin
        .from('wallet_x_bindings')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching bindings by wallet:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting bindings by wallet:', error);
      throw error;
    }
  }

  /**
   * Check if a binding exists
   */
  async bindingExists(platformUserId: string, walletAddress: string): Promise<boolean> {
    try {
      const { supabaseAdmin } = await import('./supabase');
      const { data, error } = await supabaseAdmin
        .from('wallet_x_bindings')
        .select('id')
        .eq('platform_user_id', platformUserId)
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking binding existence:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if binding exists:', error);
      return false;
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
      const { supabaseAdmin } = await import('./supabase');
      const updateData: any = {};

      if (updates.minted !== undefined) updateData.minted = updates.minted;
      if (updates.lastMintAt) updateData.last_mint_at = updates.lastMintAt.toISOString();
      if (updates.extraMetadata) updateData.extra_metadata = updates.extraMetadata;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabaseAdmin
        .from('wallet_x_bindings')
        .update(updateData)
        .eq('platform_user_id', platformUserId)
        .eq('wallet_address', walletAddress.toLowerCase())
        .select()
        .single();

      if (error) {
        console.error('Error updating binding:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating binding:', error);
      throw error;
    }
  }

  /**
   * Mark a wallet as minted (convenience method)
   */
  async markAsMinted(
    platformUserId: string,
    walletAddress: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabaseService.markAsMinted(platformUserId, walletAddress, metadata);
    } catch (error) {
      console.error('Error marking as minted:', error);
      throw error;
    }
  }

  /**
   * Deactivate a binding
   */
  async deactivateBinding(platformUserId: string, walletAddress: string): Promise<void> {
    try {
      await this.updateBinding(platformUserId, walletAddress, { isActive: false });
    } catch (error) {
      console.error('Error deactivating binding:', error);
      throw error;
    }
  }

  /**
   * Get all active bindings
   */
  async getAllActiveBindings(): Promise<WalletXBinding[]> {
    try {
      const { supabaseAdmin } = await import('./supabase');
      const { data, error } = await supabaseAdmin
        .from('wallet_x_bindings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all active bindings:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting all active bindings:', error);
      throw error;
    }
  }

  /**
   * Get binding statistics
   */
  async getBindingStats(): Promise<{
    totalBindings: number;
    activeBindings: number;
    mintedBindings: number;
    uniqueWallets: number;
    uniqueUsers: number;
  }> {
    try {
      const { supabaseAdmin } = await import('./supabase');
      const { data, error } = await supabaseAdmin
        .from('wallet_x_bindings')
        .select('*');

      if (error) {
        console.error('Error fetching binding stats:', error);
        throw error;
      }

      const bindings = data || [];
      const uniqueWallets = new Set(bindings.map(b => b.wallet_address)).size;
      const uniqueUsers = new Set(bindings.map(b => b.platform_user_id)).size;

      return {
        totalBindings: bindings.length,
        activeBindings: bindings.filter(b => b.is_active).length,
        mintedBindings: bindings.filter(b => b.minted).length,
        uniqueWallets,
        uniqueUsers
      };
    } catch (error) {
      console.error('Error getting binding stats:', error);
      throw error;
    }
  }

  /**
   * Check if user can mint (has active binding and hasn't minted yet)
   */
  async canUserMint(platformUserId: string, walletAddress: string): Promise<boolean> {
    try {
      return await supabaseService.canWalletMint(platformUserId, walletAddress);
    } catch (error) {
      console.error('Error checking if user can mint:', error);
      return false;
    }
  }

  /**
   * Get user's mint history
   */
  async getUserMintHistory(platformUserId: string): Promise<any[]> {
    try {
      const { supabaseAdmin } = await import('./supabase');
      const { data, error } = await supabaseAdmin
        .from('token_mints')
        .select('*')
        .eq('platform_user_id', platformUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user mint history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user mint history:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const walletBindingService = WalletBindingService.getInstance();