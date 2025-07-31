import { type NextRequest, NextResponse } from "next/server"
import { firebaseOperations } from "@/lib/firebase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const creatorWallet = searchParams.get("creator")

    const limit = limitParam ? Number.parseInt(limitParam) : 10

    let tokens
    if (creatorWallet) {
      tokens = await firebaseOperations.getTokensByCreator(creatorWallet)
    } else {
      tokens = await firebaseOperations.getTokens(limit)
    }

    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length,
    })
  } catch (error) {
    console.error("Failed to fetch tokens:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch tokens" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, symbol, description, totalSupply, creatorWallet, metrics, thresholds, weights, logoUrl } = body

    // Validate required fields
    if (!name || !symbol || !totalSupply || !creatorWallet) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate metrics configuration
    if (metrics && thresholds && weights) {
      if (metrics.length !== thresholds.length || metrics.length !== weights.length) {
        return NextResponse.json(
          { success: false, error: "Metrics, thresholds, and weights arrays must have the same length" },
          { status: 400 },
        )
      }

      const totalWeight = weights.reduce((sum: number, weight: number) => sum + weight, 0)
      if (totalWeight !== 100) {
        return NextResponse.json({ success: false, error: "Total weight must equal 100%" }, { status: 400 })
      }
    }

    // Generate token ID
    const tokenId = `${symbol.toLowerCase()}_${Date.now()}`

    // Create token data
    const tokenData = {
      name,
      symbol: symbol.toUpperCase(),
      description: description || "",
      totalSupply: totalSupply.toString(),
      creatorWallet,
      metrics: metrics || [],
      thresholds: thresholds || [],
      weights: weights || [],
      logoUrl: logoUrl || "",
      currentPrice: "0.01", // Default price
      marketCap: "0",
      holdersCount: 1, // Creator is the first holder
      contractAddress: "", // Will be set after deployment
      deployed: false,
    }

    // Save to Firebase
    await firebaseOperations.createToken(tokenId, tokenData)

    return NextResponse.json({
      success: true,
      tokenId,
      token: { id: tokenId, ...tokenData },
    })
  } catch (error) {
    console.error("Failed to create token:", error)
    return NextResponse.json({ success: false, error: "Failed to create token" }, { status: 500 })
  }
}
