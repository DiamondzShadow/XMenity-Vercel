import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"
import { verifyMessage } from "viem"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, signature, message } = body

    if (!walletAddress || !signature || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user and verify nonce exists
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    })

    if (!user || !user.nonce) {
      return NextResponse.json({ error: "User not found or nonce expired" }, { status: 404 })
    }

    // Verify the signature using SIWE
    try {
      const isValid = await verifyMessage({
        address: walletAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })

      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    } catch (verificationError) {
      console.error("Signature verification failed:", verificationError)
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 })
    }

    // Clear the nonce after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: { nonce: null },
    })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    )

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return NextResponse.json({ 
      token, 
      user: { 
        id: user.id, 
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        profileImage: user.profileImage 
      } 
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
