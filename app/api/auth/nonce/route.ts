import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Generate a random nonce
    const nonce = crypto.randomBytes(32).toString("hex")

    const supabase = createServerSupabaseClient()

    // Store or update the nonce for this wallet address
    const { error } = await supabase.from("users").upsert(
      {
        wallet_address: walletAddress.toLowerCase(),
        nonce,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "wallet_address",
      },
    )

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to generate nonce" }, { status: 500 })
    }

    return NextResponse.json({ nonce })
  } catch (error) {
    console.error("Nonce generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
