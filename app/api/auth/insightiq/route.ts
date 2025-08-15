import { type NextRequest, NextResponse } from "next/server"
import { insightiq } from "@/lib/insightiq"
import { createServerSupabaseClient } from "@/lib/supabase"
import { API_CONFIG } from "@/lib/constants"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { username, walletAddress } = await request.json()

    if (!username || !walletAddress) {
      return NextResponse.json({ 
        success: false, 
        error: "Username and wallet address are required" 
      }, { status: 400 })
    }

    // Verify creator with InsightIQ
    const verificationResult = await insightiq.verifyCreator(username, walletAddress)

    if (!verificationResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: verificationResult.error || "Verification failed" 
      }, { status: 400 })
    }

    if (!verificationResult.eligibleForTokenCreation) {
      return NextResponse.json({ 
        success: false, 
        error: "Creator profile does not meet minimum requirements for token creation" 
      }, { status: 400 })
    }

    const { profile } = verificationResult
    const supabase = createServerSupabaseClient()

    // Create or update user profile in Supabase using upsert for atomic operation
    const userProfileData = {
      wallet_address: walletAddress.toLowerCase(),
      display_name: profile!.displayName,
      twitter_username: profile!.username,
      twitter_id: profile!.id,
      profile_image: profile!.profileImage,
      follower_count: profile!.followers,
      following_count: profile!.following,
      tweet_count: profile!.tweets,
      is_verified: profile!.verified,
      verification_status: `insightiq_${verificationResult.verificationLevel}`,
      updated_at: new Date().toISOString(),
    }

    const { data: userData, error } = await supabase
      .from("users")
      .upsert(userProfileData, { 
        onConflict: "wallet_address",
        defaultToNull: false 
      })
      .select()
      .single()
    
    if (error) throw error

    // Generate JWT token for authentication
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is required")
    }
    
    const authToken = jwt.sign(
      {
        userId: userData.id,
        walletAddress: userData.wallet_address,
        username: profile!.username,
        verificationLevel: verificationResult.verificationLevel,
        insightiqVerified: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: API_CONFIG.jwtExpiration },
    )

    // Get milestone configuration for token creation
    const milestoneConfig = await insightiq.getMilestoneConfig(profile!)

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        walletAddress: userData.wallet_address,
        displayName: userData.display_name,
        username: userData.twitter_username,
        profileImage: userData.profile_image,
        followerCount: userData.follower_count,
        isVerified: userData.is_verified,
        verificationLevel: verificationResult.verificationLevel,
        engagementRate: profile!.engagement.avgEngagementRate,
        metrics: profile!.metrics,
      },
      token: authToken,
      milestoneConfig,
      profile: profile!,
    })
  } catch (error) {
    console.error("InsightIQ verification error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")
    const action = searchParams.get("action")

    if (!username) {
      return NextResponse.json({ 
        success: false, 
        error: "Username is required" 
      }, { status: 400 })
    }

    switch (action) {
      case "metrics":
        const metrics = await insightiq.getTokenMetrics(username)
        return NextResponse.json({
          success: true,
          username,
          metrics,
        })

      case "update":
        const updatedMetrics = await insightiq.updateMetrics(username)
        return NextResponse.json({
          success: true,
          username,
          metrics: updatedMetrics,
          updated: true,
        })

      case "profile":
      default:
        const profile = await insightiq.getProfile(username)
        return NextResponse.json({
          success: true,
          profile,
        })
    }
  } catch (error) {
    console.error("InsightIQ API error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
