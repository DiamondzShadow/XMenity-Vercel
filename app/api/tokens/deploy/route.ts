import { type NextRequest, NextResponse } from "next/server"
import { firebaseOperations } from "@/lib/firebase"
import { insightiq } from "@/lib/insightiq"
import { Web3Utils } from "@/lib/web3"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokenId, jwtToken, transactionHash } = body

    // Validate required fields
    if (!tokenId || !jwtToken) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: tokenId, jwtToken"
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

    // Get token data from Firebase
    const tokenData = await firebaseOperations.getTokenById(tokenId)
    if (!tokenData) {
      return NextResponse.json({
        success: false,
        error: "Token not found"
      }, { status: 404 })
    }

    // Verify the creator owns this token
    if (tokenData.creatorWallet.toLowerCase() !== jwtPayload.creator_wallet.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized: You can only deploy your own tokens"
      }, { status: 403 })
    }

    // Check if token is already deployed
    if (tokenData.deployed && tokenData.contractAddress) {
      return NextResponse.json({
        success: false,
        error: "Token is already deployed",
        contractAddress: tokenData.contractAddress
      }, { status: 409 })
    }

    let deploymentResult
    
    if (transactionHash) {
      // If transaction hash is provided, the deployment was done client-side
      // We just need to update our records
      try {
        // Verify the transaction exists and get contract address
        const provider = Web3Utils.getProvider()
        const receipt = await provider.getTransactionReceipt(transactionHash)
        
        if (!receipt) {
          return NextResponse.json({
            success: false,
            error: "Transaction not found or not yet mined"
          }, { status: 400 })
        }

        // Extract contract address from transaction receipt
        const contractAddress = receipt.contractAddress || receipt.logs[0]?.address
        
        if (!contractAddress) {
          return NextResponse.json({
            success: false,
            error: "Contract address not found in transaction receipt"
          }, { status: 400 })
        }

        deploymentResult = {
          contractAddress,
          transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        }
      } catch (error) {
        console.error("Error verifying transaction:", error)
        return NextResponse.json({
          success: false,
          error: "Failed to verify deployment transaction"
        }, { status: 400 })
      }
    } else {
      // Server-side deployment (requires admin private key)
      try {
        if (!process.env.ADMIN_WALLET_PRIVATE_KEY) {
          return NextResponse.json({
            success: false,
            error: "Server-side deployment not configured"
          }, { status: 500 })
        }

        const deploymentData = {
          name: tokenData.name,
          symbol: tokenData.symbol,
          initialSupply: tokenData.initialSupply,
          metricNames: tokenData.metricNames,
          thresholds: tokenData.thresholds,
          multipliers: tokenData.multipliers,
          creator: tokenData.creatorWallet,
          creatorData: {
            username: tokenData.creatorUsername,
            verification_level: tokenData.verificationLevel,
            metrics: tokenData.metrics,
          },
        }

        deploymentResult = await Web3Utils.deployToken(deploymentData)
      } catch (error) {
        console.error("Server-side deployment failed:", error)
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : "Deployment failed"
        }, { status: 500 })
      }
    }

    // Update token data in Firebase
    const updatedTokenData = {
      ...tokenData,
      deployed: true,
      contractAddress: deploymentResult.contractAddress,
      deploymentTx: deploymentResult.transactionHash,
      deployedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      blockNumber: deploymentResult.blockNumber,
      gasUsed: deploymentResult.gasUsed,
    }

    await firebaseOperations.updateToken(tokenId, updatedTokenData)

    // Get fresh contract information
    let contractInfo = null
    try {
      contractInfo = await Web3Utils.getTokenInfo(deploymentResult.contractAddress)
    } catch (error) {
      console.error("Failed to get contract info:", error)
      // Continue without contract info
    }

    return NextResponse.json({
      success: true,
      deployment: deploymentResult,
      token: {
        ...updatedTokenData,
        ...contractInfo,
      },
      message: "Token deployed successfully!"
    })
  } catch (error) {
    console.error("Token deployment failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Deployment failed"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get("tokenId")
    const contractAddress = searchParams.get("contractAddress")

    if (!tokenId && !contractAddress) {
      return NextResponse.json({
        success: false,
        error: "Either tokenId or contractAddress is required"
      }, { status: 400 })
    }

    let tokenData
    if (tokenId) {
      tokenData = await firebaseOperations.getTokenById(tokenId)
    } else if (contractAddress) {
      const tokens = await firebaseOperations.getTokens(1000)
      tokenData = tokens.find(token => 
        token.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
      )
    }

    if (!tokenData) {
      return NextResponse.json({
        success: false,
        error: "Token not found"
      }, { status: 404 })
    }

    // If token is deployed, get live contract data
    let contractInfo = null
    if (tokenData.deployed && tokenData.contractAddress) {
      try {
        contractInfo = await Web3Utils.getTokenInfo(tokenData.contractAddress)
      } catch (error) {
        console.error("Failed to get contract info:", error)
      }
    }

    return NextResponse.json({
      success: true,
      token: {
        ...tokenData,
        ...contractInfo,
      },
      deployed: tokenData.deployed,
      contractAddress: tokenData.contractAddress,
    })
  } catch (error) {
    console.error("Failed to get token deployment status:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to get deployment status"
    }, { status: 500 })
  }
}
