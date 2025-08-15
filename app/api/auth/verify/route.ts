import { type NextRequest, NextResponse } from "next/server"
import { insightiq } from "@/lib/insightiq"
import { firebaseOperations } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, walletAddress, signature, message } = body

    // Validate required fields
    if (!username || !walletAddress) {
      return NextResponse.json(
        { success: false, error: "Username and wallet address are required" },
        { status: 400 }
      )
    }

    // Verify creator with InsightIQ
    const creatorData = await insightiq.verifyCreator(username, walletAddress)
    
    // Check eligibility for token creation
    const eligibility = await insightiq.isEligibleForTokenLaunch(username)
    
    if (!eligibility.eligible) {
      return NextResponse.json(
        { 
          success: false, 
          error: eligibility.reason,
          requirements: eligibility.requirements,
          currentMetrics: eligibility.currentMetrics
        },
        { status: 403 }
      )
    }

    // Generate JWT token
    const jwtToken = insightiq.generateJWT(creatorData)

    // Store or update creator data in Firebase
    const creatorId = `${username}_${walletAddress.slice(0, 6)}`
    await firebaseOperations.collection('creators').doc(creatorId).set({
      username,
      walletAddress,
      verificationLevel: creatorData.verification_level,
      metrics: creatorData.metrics,
      milestones: creatorData.milestones,
      verifiedAt: creatorData.verified_at,
      lastUpdated: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      token: jwtToken,
      creator: creatorData,
      eligibility,
    })
  } catch (error) {
    console.error("Creator verification failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Verification failed" 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      )
    }

    // Verify JWT token
    const payload = insightiq.verifyJWT(token)
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      payload,
      valid: true,
    })
  } catch (error) {
    console.error("Token verification failed:", error)
    return NextResponse.json(
      { success: false, error: "Token verification failed" },
      { status: 500 }
    )
  }
}
