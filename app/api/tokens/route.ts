import { type NextRequest, NextResponse } from "next/server"
import { firebaseOperations } from "@/lib/firebase"
import { insightiq } from "@/lib/insightiq"
import { Web3Utils } from "@/lib/web3"
import { ethers } from "ethers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const creatorWallet = searchParams.get("creator")
    const verified = searchParams.get("verified")

    const limit = limitParam ? Number.parseInt(limitParam) : 10

    let tokens
    if (creatorWallet) {
      tokens = await firebaseOperations.getTokensByCreator(creatorWallet)
    } else {
      tokens = await firebaseOperations.getTokens(limit)
    }

    // Filter verified tokens if requested
    if (verified === "true") {
      tokens = tokens.filter(token => token.deployed && token.contractAddress)
    }

    // Enrich tokens with real-time data for deployed tokens
    const enrichedTokens = await Promise.all(
      tokens.map(async (token) => {
        if (token.deployed && token.contractAddress) {
          try {
            const contractInfo = await Web3Utils.getTokenInfo(token.contractAddress)
            return {
              ...token,
              ...contractInfo,
              currentPrice: token.currentPrice || "0.01",
              marketCap: calculateMarketCap(contractInfo.totalSupply, token.currentPrice || "0.01"),
            }
          } catch (error) {
            console.error(`Failed to get info for token ${token.contractAddress}:`, error)
            return token
          }
        }
        return token
      })
    )

    return NextResponse.json({
      success: true,
      tokens: enrichedTokens,
      count: enrichedTokens.length,
    })
  } catch (error) {
    console.error("Failed to fetch tokens:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch tokens" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      symbol, 
      description, 
      creatorWallet, 
      logoUrl, 
      jwtToken,
      customTokenomics 
    } = body

    // Validate required fields
    if (!name || !symbol || !creatorWallet || !jwtToken) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields: name, symbol, creatorWallet, jwtToken" 
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

    // Ensure the creator wallet matches the JWT
    if (jwtPayload.creator_wallet.toLowerCase() !== creatorWallet.toLowerCase()) {
      return NextResponse.json({ 
        success: false, 
        error: "Wallet address mismatch" 
      }, { status: 403 })
    }

    // Calculate tokenomics based on creator metrics
    const tokenomics = customTokenomics || insightiq.calculateTokenomics(jwtPayload.metrics)

    // Validate symbol uniqueness
    const existingTokens = await firebaseOperations.getTokens(1000)
    const symbolExists = existingTokens.some(token => 
      token.symbol.toLowerCase() === symbol.toLowerCase()
    )

    if (symbolExists) {
      return NextResponse.json({ 
        success: false, 
        error: "Token symbol already exists. Please choose a different symbol." 
      }, { status: 409 })
    }

    // Generate token ID
    const tokenId = `${symbol.toLowerCase()}_${Date.now()}`

    // Create token data
    const tokenData = {
      name: name.trim(),
      symbol: symbol.toUpperCase().trim(),
      description: description?.trim() || "",
      creatorWallet: creatorWallet.toLowerCase(),
      creatorUsername: jwtPayload.username,
      verificationLevel: jwtPayload.verification_level,
      initialSupply: tokenomics.initialSupply.toString(),
      metricNames: tokenomics.metricNames,
      thresholds: tokenomics.thresholds,
      multipliers: tokenomics.multipliers,
      logoUrl: logoUrl || "",
      currentPrice: "0.01", // Default price in ETH
      marketCap: "0",
      holdersCount: 0,
      volume24h: "0",
      contractAddress: "",
      deployed: false,
      deploymentTx: "",
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      metrics: jwtPayload.metrics,
      milestones: {
        current: {
          followers: jwtPayload.metrics.followers,
          engagement_rate: jwtPayload.metrics.engagement_rate,
          authenticity_score: jwtPayload.metrics.authenticity_score,
        },
        targets: {
          followers: tokenomics.thresholds[0],
          engagement_rate: tokenomics.thresholds[1],
          authenticity_score: tokenomics.thresholds[2],
        },
        achieved: [],
      },
    }

    // Save to Firebase
    await firebaseOperations.createToken(tokenId, tokenData)

    // Attempt contract deployment (optional for now - can be done later)
    let deploymentResult = null
    try {
      // This would normally require the user to sign the transaction
      // For now, we'll just prepare the deployment data
      deploymentResult = {
        prepared: true,
        deploymentData: {
          name: tokenData.name,
          symbol: tokenData.symbol,
          initialSupply: tokenData.initialSupply,
          metricNames: tokenData.metricNames,
          thresholds: tokenData.thresholds,
          multipliers: tokenData.multipliers,
          creator: tokenData.creatorWallet,
          creatorData: {
            username: jwtPayload.username,
            verification_level: jwtPayload.verification_level,
            metrics: jwtPayload.metrics,
          },
        },
      }
    } catch (deployError) {
      console.error("Deployment preparation failed:", deployError)
      // Continue without deployment - user can deploy later
    }

    return NextResponse.json({
      success: true,
      tokenId,
      token: { 
        id: tokenId, 
        ...tokenData 
      },
      tokenomics: {
        initialSupply: tokenomics.initialSupply,
        metricNames: tokenomics.metricNames,
        thresholds: tokenomics.thresholds,
        multipliers: tokenomics.multipliers,
      },
      deployment: deploymentResult,
    })
  } catch (error) {
    console.error("Failed to create token:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create token" 
    }, { status: 500 })
  }
}

// Helper function to calculate market cap
function calculateMarketCap(totalSupply: string, price: string): string {
  try {
    const supply = parseFloat(totalSupply)
    const priceNum = parseFloat(price)
    const marketCap = supply * priceNum
    return marketCap.toFixed(2)
  } catch {
    return "0"
  }
}
