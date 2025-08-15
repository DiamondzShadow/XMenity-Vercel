import { type NextRequest, NextResponse } from "next/server"
import { insightIQ } from "@/lib/insightiq"
import { firebaseOperations } from "@/lib/firebase"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      username, 
      platform = "twitter", 
      walletAddress,
      tokenData 
    } = body

    if (!username || !walletAddress) {
      return NextResponse.json({ 
        success: false, 
        error: "Username and wallet address required" 
      }, { status: 400 })
    }

    // Step 1: Get user data from InsightIQ
    const insightiqUser = await insightIQ.getUserByUsername(username, platform)
    
    if (!insightiqUser) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found on InsightIQ" 
      }, { status: 404 })
    }

    // Step 2: Verify influencer eligibility
    const verification = await insightIQ.verifyInfluencer(username, platform)
    
    if (!verification.verified) {
      return NextResponse.json({ 
        success: false, 
        error: "User does not meet verification criteria",
        requirements: {
          minFollowers: 1000,
          minEngagementRate: 0.01,
          minInfluenceScore: 50
        },
        userMetrics: {
          followers: insightiqUser.followers,
          engagementRate: insightiqUser.engagementRate,
          influenceScore: insightiqUser.influenceScore
        }
      }, { status: 403 })
    }

    // Step 3: Calculate milestone-based tokenomics
    const tokenomics = calculateMilestoneTokenomics(insightiqUser, verification.tier)

    // Step 4: Create or update user profile with verification data
    const userData = {
      walletAddress: walletAddress.toLowerCase(),
      username,
      platform,
      insightiqId: insightiqUser.id,
      followers: insightiqUser.followers,
      engagementRate: insightiqUser.engagementRate,
      influenceScore: insightiqUser.influenceScore,
      tier: verification.tier,
      verified: true,
      verifiedAt: new Date(),
      tokenomics,
      profileImage: insightiqUser.profileImage,
      bio: insightiqUser.bio,
    }

    // Save user profile to database
    await firebaseOperations.createUserProfile(walletAddress, userData)

    // Step 5: Generate JWT token with verification data
    const token = jwt.sign(
      { 
        walletAddress: walletAddress.toLowerCase(),
        username,
        verified: true,
        tier: verification.tier,
        influenceScore: verification.score,
        tokenomics
      },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    )

    // Step 6: If token creation data is provided, validate and prepare for deployment
    let tokenDeploymentData = null
    if (tokenData) {
      tokenDeploymentData = prepareTokenDeployment(tokenData, insightiqUser, tokenomics)
    }

    return NextResponse.json({
      success: true,
      user: {
        walletAddress: walletAddress.toLowerCase(),
        username,
        platform,
        verified: true,
        tier: verification.tier,
        influenceScore: verification.score,
        tokenomics,
        profileImage: insightiqUser.profileImage,
        followers: insightiqUser.followers,
        engagementRate: insightiqUser.engagementRate
      },
      token,
      tokenDeploymentData
    })

  } catch (error) {
    console.error("InsightIQ verification error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Verification failed" 
    }, { status: 500 })
  }
}

// Calculate milestone-based tokenomics
function calculateMilestoneTokenomics(user: any, tier: string) {
  // Base tokenomics
  const baseSupply = 1000000
  const basePrice = 0.01

  // Tier multipliers
  const tierMultipliers = {
    nano: { supply: 1, price: 1, rewards: 1 },
    micro: { supply: 2, price: 1.5, rewards: 1.2 },
    macro: { supply: 5, price: 2, rewards: 1.5 },
    mega: { supply: 10, price: 3, rewards: 2 }
  }

  const multiplier = tierMultipliers[tier as keyof typeof tierMultipliers] || tierMultipliers.nano

  // Calculate metrics-based adjustments
  const followerBonus = Math.min(user.followers / 10000, 10) // Max 10x bonus
  const engagementBonus = Math.min(user.engagementRate * 100, 5) // Max 5x bonus
  const influenceBonus = Math.min(user.influenceScore / 20, 5) // Max 5x bonus

  const totalSupply = Math.floor(
    baseSupply * multiplier.supply * (1 + followerBonus * 0.1 + engagementBonus * 0.1 + influenceBonus * 0.1)
  )

  const initialPrice = (basePrice * multiplier.price).toFixed(4)

  // Milestone-based reward structure
  const milestones = [
    { holders: 100, reward: 0.05, unlocked: false },
    { holders: 500, reward: 0.1, unlocked: false },
    { holders: 1000, reward: 0.15, unlocked: false },
    { holders: 5000, reward: 0.2, unlocked: false },
    { holders: 10000, reward: 0.25, unlocked: false }
  ]

  return {
    totalSupply,
    initialPrice,
    tier,
    multipliers: {
      tierMultiplier: multiplier,
      followerBonus: Math.round(followerBonus * 100) / 100,
      engagementBonus: Math.round(engagementBonus * 100) / 100,
      influenceBonus: Math.round(influenceBonus * 100) / 100
    },
    milestones,
    rewardMultiplier: multiplier.rewards,
    createdAt: new Date()
  }
}

// Prepare token deployment data
function prepareTokenDeployment(tokenData: any, user: any, tokenomics: any) {
  return {
    name: tokenData.name || `${user.username} Token`,
    symbol: tokenData.symbol || user.username.substring(0, 6).toUpperCase(),
    description: tokenData.description || `Social token for ${user.username}`,
    totalSupply: tokenomics.totalSupply,
    initialPrice: tokenomics.initialPrice,
    creatorWallet: tokenData.creatorWallet,
    metrics: {
      followers: user.followers,
      engagementRate: user.engagementRate,
      influenceScore: user.influenceScore,
      tier: tokenomics.tier
    },
    thresholds: tokenomics.milestones.map(m => m.holders),
    weights: tokenomics.milestones.map(m => m.reward),
    logoUrl: tokenData.logoUrl || user.profileImage,
    verified: true,
    insightiqVerified: true
  }
}