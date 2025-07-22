import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Types for our tables
export type WalletXBinding = Database['public']['Tables']['wallet_x_bindings']['Row'];
export type WalletXBindingInsert = Database['public']['Tables']['wallet_x_bindings']['Insert'];
export type WalletXBindingUpdate = Database['public']['Tables']['wallet_x_bindings']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type TokenMint = Database['public']['Tables']['token_mints']['Row'];
export type TokenMintInsert = Database['public']['Tables']['token_mints']['Insert'];

// Helper functions for common operations
export class SupabaseService {
  private static instance: SupabaseService;

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Get wallet bindings for a platform user
   */
  async getWalletBindings(platformUserId: string): Promise<WalletXBinding[]> {
    const { data, error } = await supabaseAdmin
      .from('wallet_x_bindings')
      .select('*')
      .eq('platform_user_id', platformUserId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching wallet bindings:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new wallet binding
   */
  async createWalletBinding(binding: WalletXBindingInsert): Promise<WalletXBinding> {
    const { data, error } = await supabaseAdmin
      .from('wallet_x_bindings')
      .insert(binding)
      .select()
      .single();

    if (error) {
      console.error('Error creating wallet binding:', error);
      throw error;
    }

    return data;
  }

  /**
   * Mark wallet as minted
   */
  async markAsMinted(
    platformUserId: string,
    walletAddress: string,
    metadata: any
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('wallet_x_bindings')
      .update({
        minted: true,
        last_mint_at: new Date().toISOString(),
        extra_metadata: metadata
      })
      .eq('platform_user_id', platformUserId)
      .eq('wallet_address', walletAddress);

    if (error) {
      console.error('Error marking as minted:', error);
      throw error;
    }
  }

  /**
   * Create or update profile
   */
  async upsertProfile(profile: ProfileInsert): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(profile, { 
        onConflict: 'platform_user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      throw error;
    }

    return data;
  }

  /**
   * Record a token mint
   */
  async recordTokenMint(mint: TokenMintInsert): Promise<TokenMint> {
    const { data, error } = await supabaseAdmin
      .from('token_mints')
      .insert(mint)
      .select()
      .single();

    if (error) {
      console.error('Error recording token mint:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get user profile by platform ID
   */
  async getProfile(platformUserId: string): Promise<Profile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('platform_user_id', platformUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get all mints for a wallet
   */
  async getWalletMints(walletAddress: string): Promise<TokenMint[]> {
    const { data, error } = await supabaseAdmin
      .from('token_mints')
      .select('*')
      .eq('recipient_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wallet mints:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get mint statistics
   */
  async getMintStats(): Promise<{
    totalMints: number;
    totalWallets: number;
    totalAmount: number;
  }> {
    const [mintsResult, walletsResult, amountResult] = await Promise.all([
      supabaseAdmin.from('token_mints').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('wallet_x_bindings').select('*', { count: 'exact', head: true }).eq('minted', true),
      supabaseAdmin.from('token_mints').select('amount')
    ]);

    const totalAmount = amountResult.data?.reduce(
      (sum, mint) => sum + parseFloat(mint.amount), 
      0
    ) || 0;

    return {
      totalMints: mintsResult.count || 0,
      totalWallets: walletsResult.count || 0,
      totalAmount
    };
  }

  /**
   * Check if wallet can mint (not already minted)
   */
  async canWalletMint(platformUserId: string, walletAddress: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('wallet_x_bindings')
      .select('minted')
      .eq('platform_user_id', platformUserId)
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking mint eligibility:', error);
      throw error;
    }

    return !data?.minted;
  }
}