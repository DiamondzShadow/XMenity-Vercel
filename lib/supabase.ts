import { createClient } from "@supabase/supabase-js"
import {
  createServerComponentClient as createSupabaseServerClient,
  createClientComponentClient as createSupabaseClientClient,
} from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client
export const createServerComponentClient = () => {
  return createSupabaseServerClient({ cookies })
}

// Client component Supabase client
export const createClientComponentClient = () => {
  return createSupabaseClientClient()
}

// Database operations
export const supabaseOperations = {
  // Token operations
  async createToken(tokenData: any) {
    try {
      const { data, error } = await supabase
        .from("tokens")
        .insert([
          {
            ...tokenData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating token:", error)
      throw error
    }
  },

  async getToken(tokenId: string) {
    try {
      const { data, error } = await supabase.from("tokens").select("*").eq("id", tokenId).single()

      if (error && error.code !== "PGRST116") throw error
      return data
    } catch (error) {
      console.error("Error getting token:", error)
      return null
    }
  },

  async getTokenByContractAddress(contractAddress: string) {
    try {
      const { data, error } = await supabase
        .from("tokens")
        .select("*")
        .eq("contract_address", contractAddress.toLowerCase())
        .single()

      if (error && error.code !== "PGRST116") throw error
      return data
    } catch (error) {
      console.error("Error getting token by contract address:", error)
      return null
    }
  },

  async getTokenBySymbol(symbol: string) {
    try {
      const { data, error } = await supabase.from("tokens").select("*").eq("symbol", symbol.toUpperCase()).single()

      if (error && error.code !== "PGRST116") throw error
      return data
    } catch (error) {
      console.error("Error getting token by symbol:", error)
      return null
    }
  },

  async getTokens(limit = 100, offset = 0) {
    try {
      const { data, error } = await supabase
        .from("tokens")
        .select(`
          *,
          users!tokens_creator_id_fkey (
            display_name,
            twitter_username,
            profile_image
          )
        `)
        .eq("is_public", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      // Return mock data if no data exists
      if (!data || data.length === 0) {
        return [
          {
            id: "xmenity_social_token",
            name: "XMenity Social Token",
            symbol: "XMEN",
            contract_address: "0x1234567890123456789012345678901234567890",
            total_supply: "1000000",
            current_price: "0.05",
            creator_wallet: "0x1111111111111111111111111111111111111111",
            verified: true,
            description: "The official XMenity platform token for social creators",
            logo_url: "/placeholder-logo.png",
            metrics: {
              followers: 15420,
              engagement: 8.7,
              influence: 92,
              posts: 342,
            },
            milestones: [
              { target: 10000, current: 15420, label: "Followers", completed: true },
              { target: 100, current: 92, label: "Influence Score", completed: false },
              { target: 500, current: 342, label: "Posts", completed: false },
            ],
            created_at: "2024-01-15T00:00:00Z",
            users: {
              display_name: "XMenity Official",
              twitter_username: "xmenity",
              profile_image: "/placeholder-user.jpg",
            },
          },
          {
            id: "creator_coin_alpha",
            name: "Creator Coin Alpha",
            symbol: "CCA",
            contract_address: "0x2345678901234567890123456789012345678901",
            total_supply: "500000",
            current_price: "0.12",
            creator_wallet: "0x2222222222222222222222222222222222222222",
            verified: false,
            description: "Alpha creator's personal token for exclusive content access",
            logo_url: "/placeholder-logo.png",
            metrics: {
              followers: 8930,
              engagement: 6.4,
              influence: 78,
              posts: 156,
            },
            milestones: [
              { target: 10000, current: 8930, label: "Followers", completed: false },
              { target: 80, current: 78, label: "Influence Score", completed: false },
              { target: 200, current: 156, label: "Posts", completed: false },
            ],
            created_at: "2024-02-01T00:00:00Z",
            users: {
              display_name: "Alpha Creator",
              twitter_username: "alphacreator",
              profile_image: "/placeholder-user.jpg",
            },
          },
          {
            id: "diamond_creator_token",
            name: "Diamond Creator Token",
            symbol: "DCT",
            contract_address: "0x3456789012345678901234567890123456789012",
            total_supply: "2000000",
            current_price: "0.03",
            creator_wallet: "0x3333333333333333333333333333333333333333",
            verified: true,
            description: "Premium creator token with exclusive perks and rewards",
            logo_url: "/placeholder-logo.png",
            metrics: {
              followers: 25680,
              engagement: 9.2,
              influence: 95,
              posts: 578,
            },
            milestones: [
              { target: 25000, current: 25680, label: "Followers", completed: true },
              { target: 90, current: 95, label: "Influence Score", completed: true },
              { target: 500, current: 578, label: "Posts", completed: true },
            ],
            created_at: "2024-01-20T00:00:00Z",
            users: {
              display_name: "Diamond Creator",
              twitter_username: "diamondcreator",
              profile_image: "/placeholder-user.jpg",
            },
          },
          {
            id: "social_influencer_coin",
            name: "Social Influencer Coin",
            symbol: "SIC",
            contract_address: "0x4567890123456789012345678901234567890123",
            total_supply: "750000",
            current_price: "0.08",
            creator_wallet: "0x4444444444444444444444444444444444444444",
            verified: true,
            description: "Token for top-tier social media influencer with global reach",
            logo_url: "/placeholder-logo.png",
            metrics: {
              followers: 45230,
              engagement: 7.8,
              influence: 88,
              posts: 892,
            },
            milestones: [
              { target: 40000, current: 45230, label: "Followers", completed: true },
              { target: 85, current: 88, label: "Influence Score", completed: true },
              { target: 1000, current: 892, label: "Posts", completed: false },
            ],
            created_at: "2024-01-10T00:00:00Z",
            users: {
              display_name: "Social Influencer",
              twitter_username: "socialinfluencer",
              profile_image: "/placeholder-user.jpg",
            },
          },
          {
            id: "content_creator_beta",
            name: "Content Creator Beta",
            symbol: "CCB",
            contract_address: "0x5678901234567890123456789012345678901234",
            total_supply: "300000",
            current_price: "0.15",
            creator_wallet: "0x5555555555555555555555555555555555555555",
            verified: false,
            description: "Beta token for emerging content creator in gaming niche",
            logo_url: "/placeholder-logo.png",
            metrics: {
              followers: 3420,
              engagement: 5.2,
              influence: 45,
              posts: 89,
            },
            milestones: [
              { target: 5000, current: 3420, label: "Followers", completed: false },
              { target: 50, current: 45, label: "Influence Score", completed: false },
              { target: 100, current: 89, label: "Posts", completed: false },
            ],
            created_at: "2024-02-10T00:00:00Z",
            users: {
              display_name: "Content Creator",
              twitter_username: "contentcreator",
              profile_image: "/placeholder-user.jpg",
            },
          },
          {
            id: "viral_creator_token",
            name: "Viral Creator Token",
            symbol: "VCT",
            contract_address: "0x6789012345678901234567890123456789012345",
            total_supply: "1500000",
            current_price: "0.07",
            creator_wallet: "0x6666666666666666666666666666666666666666",
            verified: true,
            description: "Token from viral content creator known for trending videos",
            logo_url: "/placeholder-logo.png",
            metrics: {
              followers: 67890,
              engagement: 12.4,
              influence: 97,
              posts: 234,
            },
            milestones: [
              { target: 50000, current: 67890, label: "Followers", completed: true },
              { target: 95, current: 97, label: "Influence Score", completed: true },
              { target: 300, current: 234, label: "Posts", completed: false },
            ],
            created_at: "2024-01-05T00:00:00Z",
            users: {
              display_name: "Viral Creator",
              twitter_username: "viralcreator",
              profile_image: "/placeholder-user.jpg",
            },
          },
        ]
      }

      return data
    } catch (error) {
      console.error("Error getting tokens:", error)
      return []
    }
  },

  async updateToken(tokenId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from("tokens")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tokenId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating token:", error)
      throw error
    }
  },

  // User operations
  async createUserProfile(walletAddress: string, userData: any) {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            ...userData,
            wallet_address: walletAddress.toLowerCase(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating user profile:", error)
      throw error
    }
  },

  async getUserProfile(walletAddress: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", walletAddress.toLowerCase())
        .single()

      if (error && error.code !== "PGRST116") throw error
      return data
    } catch (error) {
      console.error("Error getting user profile:", error)
      return null
    }
  },

  async updateUserProfile(walletAddress: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("wallet_address", walletAddress.toLowerCase())
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  },

  // Analytics operations
  async getTokenAnalytics(tokenId: string, period = "30d") {
    try {
      const { data, error } = await supabase
        .from("analytics")
        .select("*")
        .eq("token_id", tokenId)
        .eq("period", period)
        .order("timestamp", { ascending: false })
        .limit(100)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error getting token analytics:", error)
      return []
    }
  },

  async saveAnalyticsData(analyticsData: any) {
    try {
      const { data, error } = await supabase
        .from("analytics")
        .insert([
          {
            ...analyticsData,
            timestamp: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error saving analytics data:", error)
      throw error
    }
  },

  // File upload operations
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage.from("uploads").upload(path, file)

      if (error) throw error

      const { data: publicData } = supabase.storage.from("uploads").getPublicUrl(path)

      return publicData.publicUrl
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    }
  },

  // Utility operations
  async trackEvent(eventType: string, eventData: any) {
    try {
      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            event_type: eventType,
            event_data: eventData,
            timestamp: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error tracking event:", error)
      throw error
    }
  },
}

export default supabaseOperations
