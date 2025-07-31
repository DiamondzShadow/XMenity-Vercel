import { type NextRequest, NextResponse } from "next/server"

// Twitter OAuth configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!
const TWITTER_REDIRECT_URI = process.env.NEXT_PUBLIC_FRONTEND_URL + "/api/auth/twitter/callback"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({ walletAddress, timestamp: Date.now() })).toString("base64")

    // Twitter OAuth 2.0 authorization URL
    const authUrl = new URL("https://twitter.com/i/oauth2/authorize")
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("client_id", TWITTER_CLIENT_ID)
    authUrl.searchParams.set("redirect_uri", TWITTER_REDIRECT_URI)
    authUrl.searchParams.set("scope", "tweet.read users.read follows.read")
    authUrl.searchParams.set("state", state)
    authUrl.searchParams.set("code_challenge", "challenge")
    authUrl.searchParams.set("code_challenge_method", "plain")

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error("Twitter auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
