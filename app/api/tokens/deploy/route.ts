import { type NextRequest, NextResponse } from "next/server"
import { supabaseOperations } from "@/lib/supabase"
import { insightIQ } from "@/lib/insightiq"
import { ThirdwebSDK } from "@thirdweb-dev/sdk"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, symbol, description, totalSupply, creatorWallet, metrics, thresholds, weights } = body

    // Validate required fields
    if (!name || !symbol || !totalSupply || !creatorWallet) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Initialize Thirdweb SDK
    const sdk = ThirdwebSDK.fromPrivateKey(process.env.THIRDWEB_SECRET_KEY || "", "arbitrum")

    try {
      // Get the factory contract
      const factoryAddress = process.env.SOCIAL_TOKEN_FACTORY_ADDRESS
      if (!factoryAddress) {
        throw new Error("Factory contract address not configured")
      }

      const factory = await sdk.getContract(factoryAddress)

      // Deploy the token through the factory
      const tx = await factory.call("createSocialToken", [
        name,
        symbol,
        totalSupply,
        creatorWallet,
        metrics || [],
        thresholds || [],
        weights || [],
      ])

      // Get the deployed token address from the transaction receipt
      const receipt = await tx.receipt
      const tokenAddress = receipt.logs[0]?.address || ""

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
        contractAddress: tokenAddress,
        transactionHash: tx.hash,
        deployed: true,
        currentPrice: "0.01",
        marketCap: "0",
        holdersCount: 1,
      }

      // Save to Supabase
      await supabaseOperations.createToken(tokenId, tokenData)

      return NextResponse.json({
        success: true,
        tokenId,
        contractAddress: tokenAddress,
        transactionHash: tx.hash,
        token: { id: tokenId, ...tokenData },
      })
    } catch (contractError) {
      console.error("Contract deployment failed:", contractError)

      // For testing purposes, create a mock deployment
      const tokenId = `${symbol.toLowerCase()}_${Date.now()}`
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`

      const tokenData = {
        name,
        symbol: symbol.toUpperCase(),
        description: description || "",
        totalSupply: totalSupply.toString(),
        creatorWallet,
        metrics: metrics || [],
        thresholds: thresholds || [],
        weights: weights || [],
        contractAddress: mockAddress,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        deployed: true,
        currentPrice: "0.01",
        marketCap: "0",
        holdersCount: 1,
        testMode: true,
      }

      await supabaseOperations.createToken(tokenId, tokenData)

      return NextResponse.json({
        success: true,
        tokenId,
        contractAddress: mockAddress,
        transactionHash: tokenData.transactionHash,
        token: { id: tokenId, ...tokenData },
        testMode: true,
        note: "Deployed in test mode - contract interaction failed",
      })
    }
  } catch (error) {
    console.error("Failed to deploy token:", error)
    return NextResponse.json({ success: false, error: "Failed to deploy token" }, { status: 500 })
  }
}
