import { type NextRequest, NextResponse } from "next/server"
import { firebaseOperations } from "@/lib/firebase"
import { insightiq } from "@/lib/insightiq"
import { Web3Utils } from "@/lib/web3"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("walletAddress")
    const username = searchParams.get("username")

    if (!walletAddress && !username) {
      return NextResponse.json({
        success: false,
        error: "Either walletAddress or username is required"
      }, { status: 400 })
    }

    // Get user profile data
    let userProfile = null
    
    if (walletAddress) {
      // Try to find user by wallet address
      const creators = await firebaseOperations.collection('creators').where('walletAddress', '==', walletAddress.toLowerCase()).get()
      if (!creators.empty) {
        userProfile = creators.docs[0].data()
        userProfile.id = creators.docs[0].id
      }
    } else if (username) {
      // Try to find user by username
      const creators = await firebaseOperations.collection('creators').where('username', '==', username).get()
      if (!creators.empty) {
        userProfile = creators.docs[0].data()
        userProfile.id = creators.docs[0].id
      }
    }

    if (!userProfile) {
      return NextResponse.json({
        success: false,
        error: "User profile not found"
      }, { status: 404 })
    }

    // Get user's tokens
    const userTokens = await firebaseOperations.getTokensByCreator(userProfile.walletAddress)

    // Get user's analytics
    let analytics = null
    try {
      const analyticsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics?creatorWallet=${userProfile.walletAddress}`)
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        analytics = analyticsData.analytics
      }
    } catch (error) {
      console.error("Failed to fetch user analytics:", error)
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...userProfile,
        tokens: userTokens,
        analytics,
      },
    })
  } catch (error) {
    console.error("Failed to fetch user profile:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch user profile"
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, jwtToken, profileData } = body

    if (!walletAddress || !jwtToken) {
      return NextResponse.json({
        success: false,
        error: "Wallet address and JWT token are required"
      }, { status: 400 })
    }

    // Verify JWT token
    const jwtPayload = insightiq.verifyJWT(jwtToken)
    if (!jwtPayload) {
      return NextResponse.json({
        success: false,
        error: "Invalid or expired authentication token"
      }, { status: 401 })
    }

    // Ensure the wallet address matches the JWT
    if (jwtPayload.creator_wallet.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: "Wallet address mismatch"
      }, { status: 403 })
    }

    // Get existing profile
    const creators = await firebaseOperations.collection('creators').where('walletAddress', '==', walletAddress.toLowerCase()).get()
    
    let profileId = null
    let existingProfile = {}
    
    if (!creators.empty) {
      profileId = creators.docs[0].id
      existingProfile = creators.docs[0].data()
    } else {
      profileId = `${jwtPayload.username}_${walletAddress.slice(0, 6)}`
    }

    // Update profile data
    const updatedProfile = {
      ...existingProfile,
      ...profileData,
      walletAddress: walletAddress.toLowerCase(),
      username: jwtPayload.username,
      verificationLevel: jwtPayload.verification_level,
      metrics: jwtPayload.metrics,
      lastUpdated: new Date().toISOString(),
    }

    // Save to Firebase
    await firebaseOperations.collection('creators').doc(profileId).set(updatedProfile)

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: "Profile updated successfully"
    })
  } catch (error) {
    console.error("Failed to update user profile:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update user profile"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, walletAddress, username, jwtToken } = body

    if (!action || !walletAddress) {
      return NextResponse.json({
        success: false,
        error: "Action and wallet address are required"
      }, { status: 400 })
    }

    switch (action) {
      case 'refresh_verification':
        if (!username || !jwtToken) {
          return NextResponse.json({
            success: false,
            error: "Username and JWT token are required for verification refresh"
          }, { status: 400 })
        }

        // Verify JWT token
        const jwtPayload = insightiq.verifyJWT(jwtToken)
        if (!jwtPayload) {
          return NextResponse.json({
            success: false,
            error: "Invalid or expired authentication token"
          }, { status: 401 })
        }

        try {
          // Re-verify creator with InsightIQ
          const creatorData = await insightiq.verifyCreator(username, walletAddress)
          
          // Check eligibility
          const eligibility = await insightiq.isEligibleForTokenLaunch(username)
          
          // Generate new JWT
          const newJwtToken = insightiq.generateJWT(creatorData)

          // Update stored profile
          const profileId = `${username}_${walletAddress.slice(0, 6)}`
          await firebaseOperations.collection('creators').doc(profileId).set({
            username,
            walletAddress: walletAddress.toLowerCase(),
            verificationLevel: creatorData.verification_level,
            metrics: creatorData.metrics,
            milestones: creatorData.milestones,
            verifiedAt: creatorData.verified_at,
            lastUpdated: new Date().toISOString(),
          })

          return NextResponse.json({
            success: true,
            token: newJwtToken,
            creator: creatorData,
            eligibility,
            message: "Verification refreshed successfully"
          })
        } catch (error) {
          console.error("Verification refresh failed:", error)
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Verification refresh failed"
          }, { status: 400 })
        }

      case 'update_social_links':
        const { socialLinks } = body
        if (!socialLinks) {
          return NextResponse.json({
            success: false,
            error: "Social links data is required"
          }, { status: 400 })
        }

        // Get existing profile
        const creators = await firebaseOperations.collection('creators').where('walletAddress', '==', walletAddress.toLowerCase()).get()
        
        if (creators.empty) {
          return NextResponse.json({
            success: false,
            error: "User profile not found"
          }, { status: 404 })
        }

        const profileDoc = creators.docs[0]
        const existingProfile = profileDoc.data()

        // Update social links
        const updatedProfile = {
          ...existingProfile,
          socialLinks: {
            ...existingProfile.socialLinks,
            ...socialLinks,
          },
          lastUpdated: new Date().toISOString(),
        }

        await firebaseOperations.collection('creators').doc(profileDoc.id).set(updatedProfile)

        return NextResponse.json({
          success: true,
          profile: updatedProfile,
          message: "Social links updated successfully"
        })

      case 'update_preferences':
        const { preferences } = body
        if (!preferences) {
          return NextResponse.json({
            success: false,
            error: "Preferences data is required"
          }, { status: 400 })
        }

        // Get existing profile
        const creatorsPrefs = await firebaseOperations.collection('creators').where('walletAddress', '==', walletAddress.toLowerCase()).get()
        
        if (creatorsPrefs.empty) {
          return NextResponse.json({
            success: false,
            error: "User profile not found"
          }, { status: 404 })
        }

        const profileDocPrefs = creatorsPrefs.docs[0]
        const existingProfilePrefs = profileDocPrefs.data()

        // Update preferences
        const updatedProfilePrefs = {
          ...existingProfilePrefs,
          preferences: {
            ...existingProfilePrefs.preferences,
            ...preferences,
          },
          lastUpdated: new Date().toISOString(),
        }

        await firebaseOperations.collection('creators').doc(profileDocPrefs.id).set(updatedProfilePrefs)

        return NextResponse.json({
          success: true,
          profile: updatedProfilePrefs,
          message: "Preferences updated successfully"
        })

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action"
        }, { status: 400 })
    }
  } catch (error) {
    console.error("Profile action failed:", error)
    return NextResponse.json({
      success: false,
      error: "Profile action failed"
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("walletAddress")
    const jwtToken = searchParams.get("jwtToken")

    if (!walletAddress || !jwtToken) {
      return NextResponse.json({
        success: false,
        error: "Wallet address and JWT token are required"
      }, { status: 400 })
    }

    // Verify JWT token
    const jwtPayload = insightiq.verifyJWT(jwtToken)
    if (!jwtPayload) {
      return NextResponse.json({
        success: false,
        error: "Invalid or expired authentication token"
      }, { status: 401 })
    }

    // Ensure the wallet address matches the JWT
    if (jwtPayload.creator_wallet.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: "Wallet address mismatch"
      }, { status: 403 })
    }

    // Get user's tokens - only allow deletion if no deployed tokens
    const userTokens = await firebaseOperations.getTokensByCreator(walletAddress)
    const deployedTokens = userTokens.filter(token => token.deployed)

    if (deployedTokens.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete profile with deployed tokens. Please contact support."
      }, { status: 400 })
    }

    // Delete user profile
    const creators = await firebaseOperations.collection('creators').where('walletAddress', '==', walletAddress.toLowerCase()).get()
    
    if (!creators.empty) {
      await firebaseOperations.collection('creators').doc(creators.docs[0].id).delete()
    }

    // Delete user's tokens (non-deployed only)
    for (const token of userTokens) {
      if (!token.deployed) {
        await firebaseOperations.deleteToken(token.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile deleted successfully"
    })
  } catch (error) {
    console.error("Failed to delete user profile:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to delete user profile"
    }, { status: 500 })
  }
}
