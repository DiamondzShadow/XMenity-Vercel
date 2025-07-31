import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side client for API routes
export const createServerSupabaseClient = () => {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Alias for backwards compatibility
export const createServerComponentClient = createServerSupabaseClient

// Supabase utility functions
export const SupabaseUtils = {
  // User management utilities
  async createUserProfile(userId: string, userData: any) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        wallet_address: userData.walletAddress,
        display_name: userData.displayName,
        twitter_username: userData.twitterUsername,
        twitter_id: userData.twitterId,
        profile_image: userData.profileImage,
        follower_count: userData.followerCount,
        following_count: userData.followingCount,
        tweet_count: userData.tweetCount,
        is_verified: userData.isVerified,
        verification_status: userData.verificationStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error && error.code !== "PGRST116") throw error
    return data
  },

  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Token tracking utilities
  async trackTokenCreation(tokenData: any) {
    const { data, error } = await supabase
      .from("tokens")
      .insert({
        contract_address: tokenData.contractAddress,
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description,
        logo_url: tokenData.logoUrl,
        total_supply: tokenData.totalSupply,
        initial_supply: tokenData.initialSupply,
        creator_id: tokenData.creatorId,
        current_price: tokenData.currentPrice || "0",
        market_cap: tokenData.marketCap || "0",
        holders_count: 1,
        transactions_count: 0,
        milestone_config: tokenData.milestoneConfig,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getTokenInfo(contractAddress: string) {
    const { data, error } = await supabase
      .from("tokens")
      .select(`
        *,
        users (
          display_name,
          twitter_username,
          profile_image,
          is_verified
        )
      `)
      .eq("contract_address", contractAddress)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data
  },

  async getAllTokens(filters: any = {}) {
    let query = supabase.from("tokens").select(`
        *,
        users (
          display_name,
          twitter_username,
          profile_image,
          is_verified
        )
      `)

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,symbol.ilike.%${filters.search}%`)
    }

    if (filters.sortBy) {
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === "asc" })
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  // Transaction logging
  async logTransaction(transactionData: any) {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        tx_hash: transactionData.txHash,
        from_address: transactionData.fromAddress,
        to_address: transactionData.toAddress,
        token_address: transactionData.tokenAddress,
        amount: transactionData.amount,
        transaction_type: transactionData.transactionType,
        gas_used: transactionData.gasUsed,
        gas_price: transactionData.gasPrice,
        block_number: transactionData.blockNumber,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Milestone tracking
  async trackMilestone(milestoneData: any) {
    const { data, error } = await supabase
      .from("milestones")
      .insert({
        user_id: milestoneData.userId,
        token_id: milestoneData.tokenId,
        milestone_type: milestoneData.milestoneType,
        target_value: milestoneData.targetValue,
        current_value: milestoneData.currentValue,
        reward_amount: milestoneData.rewardAmount,
        is_completed: milestoneData.isCompleted,
        completed_at: milestoneData.completedAt,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Analytics tracking
  async trackEvent(eventType: string, eventData: any) {
    const { data, error } = await supabase
      .from("analytics")
      .insert({
        event_type: eventType,
        event_data: eventData,
        user_id: eventData.userId,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Real-time subscriptions
  subscribeToTokenUpdates(callback: (payload: any) => void) {
    return supabase
      .channel("tokens")
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens" }, callback)
      .subscribe()
  },

  subscribeToUserUpdates(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "users", filter: `id=eq.${userId}` }, callback)
      .subscribe()
  },
}

export default supabase
