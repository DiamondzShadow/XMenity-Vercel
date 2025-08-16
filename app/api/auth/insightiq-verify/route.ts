import { type NextRequest, NextResponse } from "next/server"
import { insightIQ } from "@/lib/insightiq"
import { supabaseOperations } from "@/lib/supabase"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      username, 
      platforms = ["twitter"], // Support multiple platforms
      walletAddress,
      tokenData 
    } = body

    if (!username || !walletAddress) {
      return NextResponse.json({ 
        success: false, 
        error: "Username and wallet address required" 
      }, { status: 400 })
    }

    // Step 1: Get cross-platform verification from InsightIQ
    const verification = await insightIQ.verifyCrossPlatform(username, platforms)
    
    if (!verification.verified) {
      return NextResponse.json({ 
        success: false, 
        error: "User does not meet verification requirements",
        verification
      }, { status: 400 })
    }

    // Step 2: Get enhanced user data from primary platform
    const primaryPlatform = platforms[0] || "twitter"
    const insightiqUser = await insightIQ.getUserByUsername(username, primaryPlatform)
    
    if (!insightiqUser) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found on primary platform" 
      }, { status: 404 })
    }

    // Step 3: Get AI insights for enhanced verification
    const aiInsights = await insightIQ.getAIInsights(username, primaryPlatform)

    // Step 4: Get real-time metrics if supported
    let realTimeMetrics = null
    try {
      realTimeMetrics = await insightIQ.getRealTimeMetrics(username, primaryPlatform)
    } catch (error) {
      console.log("Real-time metrics not available for", primaryPlatform)
    }

    // Step 5: Get content analytics
    const contentAnalytics = await insightIQ.getContentAnalytics(username, primaryPlatform, "30d")

    // Step 6: Create or update user profile with enhanced data
    const userData = {
      walletAddress: walletAddress.toLowerCase(),
      displayName: insightiqUser.username,
      platform: primaryPlatform,
      platformId: insightiqUser.id,
      platformUsername: insightiqUser.username,
      followers: insightiqUser.followers,
      platformVerified: verification.verified,
      insightiqId: insightiqUser.id,
      insightiqVerified: true,
      influenceScore: insightiqUser.influenceScore,
      engagementRate: insightiqUser.engagementRate,
      profileImage: insightiqUser.profileImage,
      bio: insightiqUser.bio,
      
      // Enhanced verification scores
      crossPlatformScore: verification.crossPlatformScore,
      authenticityScore: verification.authenticityScore,
      brandSafetyScore: verification.brandSafetyScore,
      tier: verification.tier,
      
      // AI insights
      aiInsights,
      contentAnalytics,
      realTimeMetrics,
      
      // Multi-platform data
      verifiedPlatforms: platforms,
      platformMetrics: insightiqUser.platformMetrics,
      
      isVerified: true,
      verificationLevel: "insightiq_verified"
    }

    // Check if user already exists
    const existingUser = await supabaseOperations.getUserProfile(walletAddress)
    
    let user
    if (existingUser) {
      user = await supabaseOperations.updateUserProfile(walletAddress, userData)
    } else {
      user = await supabaseOperations.createUserProfile(walletAddress, userData)
    }

    // Step 7: Create JWT token with enhanced claims
    const jwtSecret = process.env.NEXTAUTH_SECRET || "default-secret"
    const token = jwt.sign(
      { 
        walletAddress,
        username: insightiqUser.username,
        platform: primaryPlatform,
        verified: true,
        tier: verification.tier,
        crossPlatformScore: verification.crossPlatformScore,
        authenticityScore: verification.authenticityScore,
        brandSafetyScore: verification.brandSafetyScore,
        platforms,
        insightiqId: insightiqUser.id
      },
      jwtSecret,
      { expiresIn: "24h" }
    )

    // Step 8: If token data provided, create enhanced token profile
    let tokenProfile = null
    if (tokenData) {
      // Calculate enhanced tokenomics based on cross-platform metrics
      const baseMultiplier = verification.tier === "celebrity" ? 5 : 
                           verification.tier === "mega" ? 3 :
                           verification.tier === "macro" ? 2 : 1

      const aiMultiplier = aiInsights?.growthTrends?.predictedGrowth > 20 ? 1.5 : 1
      const crossPlatformMultiplier = platforms.length > 1 ? 1.3 : 1
      
      const enhancedTokenomics = {
        ...tokenData.tokenomics,
        baseMultiplier,
        aiMultiplier,
        crossPlatformMultiplier,
        totalMultiplier: baseMultiplier * aiMultiplier * crossPlatformMultiplier,
        enhancedMetrics: {
          predictedGrowth: aiInsights?.growthTrends?.predictedGrowth || 0,
          audienceQuality: verification.authenticityScore || 75,
          brandSafety: verification.brandSafetyScore || 85,
          crossPlatformReach: platforms.length
        }
      }

      tokenProfile = {
        id: tokenData.id || `${username}_${primaryPlatform}_token`,
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description,
        totalSupply: enhancedTokenomics.totalSupply,
        initialPrice: enhancedTokenomics.initialPrice,
        creatorWallet: walletAddress,
        metrics: {
          followers: insightiqUser.followers,
          engagementRate: insightiqUser.engagementRate,
          influenceScore: insightiqUser.influenceScore,
          tier: verification.tier,
          crossPlatformScore: verification.crossPlatformScore,
          authenticityScore: verification.authenticityScore,
          brandSafetyScore: verification.brandSafetyScore
        },
        thresholds: enhancedTokenomics.milestones.map((m: any) => m.holders),
        weights: enhancedTokenomics.milestones.map((m: any) => m.reward),
        logoUrl: tokenData.logoUrl || insightiqUser.profileImage,
        verified: true,
        insightiqVerified: true,
        enhancedTokenomics,
        aiInsights,
        contentAnalytics,
        supportedPlatforms: platforms
      }
    }

    return NextResponse.json({
      success: true,
      user,
      token,
      verification,
      aiInsights,
      contentAnalytics,
      realTimeMetrics,
      tokenProfile,
      platforms: platforms,
      message: `Successfully verified ${username} across ${platforms.length} platform(s) with InsightIQ`
    })

  } catch (error) {
    console.error("InsightIQ verification error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error during verification"
    }, { status: 500 })
  }
}
