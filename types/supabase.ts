export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          display_name: string | null
          platform: string | null
          platform_id: string | null
          platform_username: string | null
          platform_handle: string | null
          followers: number
          platform_verified: boolean
          profile_image: string | null
          insightiq_id: string | null
          insightiq_verified: boolean
          influence_score: number | null
          engagement_rate: number | null
          is_verified: boolean
          verification_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          wallet_address: string
          display_name?: string | null
          platform?: string | null
          platform_id?: string | null
          platform_username?: string | null
          platform_handle?: string | null
          followers?: number
          platform_verified?: boolean
          profile_image?: string | null
          insightiq_id?: string | null
          insightiq_verified?: boolean
          influence_score?: number | null
          engagement_rate?: number | null
          is_verified?: boolean
          verification_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          display_name?: string | null
          platform?: string | null
          platform_id?: string | null
          platform_username?: string | null
          platform_handle?: string | null
          followers?: number
          platform_verified?: boolean
          profile_image?: string | null
          insightiq_id?: string | null
          insightiq_verified?: boolean
          influence_score?: number | null
          engagement_rate?: number | null
          is_verified?: boolean
          verification_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      tokens: {
        Row: {
          id: string
          contract_address: string
          name: string
          symbol: string
          description: string | null
          logo_url: string | null
          total_supply: string
          initial_supply: string
          creator_id: string
          current_price: string
          market_cap: string
          holders_count: number
          transactions_count: number
          milestone_config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_address: string
          name: string
          symbol: string
          description?: string | null
          logo_url?: string | null
          total_supply: string
          initial_supply: string
          creator_id: string
          current_price?: string
          market_cap?: string
          holders_count?: number
          transactions_count?: number
          milestone_config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_address?: string
          name?: string
          symbol?: string
          description?: string | null
          logo_url?: string | null
          total_supply?: string
          initial_supply?: string
          creator_id?: string
          current_price?: string
          market_cap?: string
          holders_count?: number
          transactions_count?: number
          milestone_config?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          tx_hash: string
          from_address: string
          to_address: string
          token_address: string | null
          amount: string
          transaction_type: string
          gas_used: string | null
          gas_price: string | null
          block_number: number | null
          timestamp: string
        }
        Insert: {
          id?: string
          tx_hash: string
          from_address: string
          to_address: string
          token_address?: string | null
          amount: string
          transaction_type: string
          gas_used?: string | null
          gas_price?: string | null
          block_number?: number | null
          timestamp?: string
        }
        Update: {
          id?: string
          tx_hash?: string
          from_address?: string
          to_address?: string
          token_address?: string | null
          amount?: string
          transaction_type?: string
          gas_used?: string | null
          gas_price?: string | null
          block_number?: number | null
          timestamp?: string
        }
      }
      milestones: {
        Row: {
          id: string
          user_id: string
          token_id: string
          milestone_type: string
          target_value: number
          current_value: number
          reward_amount: string
          is_completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token_id: string
          milestone_type: string
          target_value: number
          current_value?: number
          reward_amount: string
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token_id?: string
          milestone_type?: string
          target_value?: number
          current_value?: number
          reward_amount?: string
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          event_type: string
          event_data: Json
          user_id: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          event_type: string
          event_data: Json
          user_id?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          event_type?: string
          event_data?: Json
          user_id?: string | null
          timestamp?: string
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
