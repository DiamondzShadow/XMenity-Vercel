export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      wallet_x_bindings: {
        Row: {
          id: string
          platform_user_id: string
          platform_username: string
          wallet_address: string
          date_linked: string
          minted: boolean
          last_mint_at: string | null
          extra_metadata: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          platform_user_id: string
          platform_username: string
          wallet_address: string
          date_linked?: string
          minted?: boolean
          last_mint_at?: string | null
          extra_metadata?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          platform_user_id?: string
          platform_username?: string
          wallet_address?: string
          date_linked?: string
          minted?: boolean
          last_mint_at?: string | null
          extra_metadata?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          platform_user_id: string
          platform: string
          username: string
          display_name: string | null
          bio: string | null
          follower_count: number
          following_count: number
          post_count: number
          is_verified: boolean
          profile_image: string | null
          location: string | null
          website: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          platform_user_id: string
          platform?: string
          username: string
          display_name?: string | null
          bio?: string | null
          follower_count?: number
          following_count?: number
          post_count?: number
          is_verified?: boolean
          profile_image?: string | null
          location?: string | null
          website?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          platform_user_id?: string
          platform?: string
          username?: string
          display_name?: string | null
          bio?: string | null
          follower_count?: number
          following_count?: number
          post_count?: number
          is_verified?: boolean
          profile_image?: string | null
          location?: string | null
          website?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      token_mints: {
        Row: {
          id: string
          platform_user_id: string
          wallet_address: string
          recipient_address: string
          token_address: string | null
          amount: string
          tx_hash: string
          block_number: number | null
          gas_used: string | null
          reason: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          platform_user_id: string
          wallet_address: string
          recipient_address: string
          token_address?: string | null
          amount: string
          tx_hash: string
          block_number?: number | null
          gas_used?: string | null
          reason?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          platform_user_id?: string
          wallet_address?: string
          recipient_address?: string
          token_address?: string | null
          amount?: string
          tx_hash?: string
          block_number?: number | null
          gas_used?: string | null
          reason?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          name: string
          key: string
          hashed_key: string
          permissions: Json | null
          rate_limit: number | null
          rate_period: number | null
          is_active: boolean
          last_used_at: string | null
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          name: string
          key: string
          hashed_key: string
          permissions?: Json | null
          rate_limit?: number | null
          rate_period?: number | null
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          key?: string
          hashed_key?: string
          permissions?: Json | null
          rate_limit?: number | null
          rate_period?: number | null
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}