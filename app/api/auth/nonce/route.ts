import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import * as crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Generate a cryptographically secure nonce
    const nonce = crypto.randomBytes(32).toString("hex")

    // Update or create user with nonce
    const user = await prisma.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: { nonce },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        nonce,
      },
    })

    return NextResponse.json({ nonce })
  } catch (error) {
    console.error("Nonce generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
