import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase-green-island.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database operations for application logic
export const supabaseOperations = {
  // Token operations
  async createToken(tokenId: string, tokenData: any) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .insert({
          id: tokenId,
          ...tokenData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating token:', error)
      throw error
    }
  },

  async getToken(tokenId: string) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('id', tokenId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  },

  async getTokenByContractAddress(contractAddress: string) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('contract_address', contractAddress.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error getting token by contract address:', error)
      return null
    }
  },

  async getTokenBySymbol(symbol: string) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error getting token by symbol:', error)
      return null
    }
  },

  async getTokens(limit = 100, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting tokens:', error)
      // Return mock data as fallback
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
        },
      ]
    }
  },

  async updateToken(tokenId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tokenId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating token:', error)
      throw error
    }
  },

  // User operations
  async createUserProfile(walletAddress: string, userData: any) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  },

  async getUserProfile(walletAddress: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  },

  async updateUserProfile(walletAddress: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', walletAddress.toLowerCase())
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  },

  // Analytics operations
  async getTokenAnalytics(tokenId: string, period = "30d") {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('token_id', tokenId)
        .eq('period', period)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting token analytics:', error)
      return []
    }
  },

  async saveAnalyticsData(analyticsData: any) {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .insert({
          ...analyticsData,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving analytics data:', error)
      throw error
    }
  },

  // File upload operations using Supabase Storage
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(path)

      return publicUrlData.publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  },

  // Utility operations
  async trackEvent(eventType: string, eventData: any) {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          event_type: eventType,
          event_data: eventData,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error tracking event:', error)
      throw error
    }
  },
}

// Export default
export default supabaseOperations
