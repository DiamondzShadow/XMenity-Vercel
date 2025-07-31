import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!
const TWITTER_REDIRECT_URI = process.env.NEXT_PUBLIC_FRONTEND_URL + "/api/auth/twitter/callback"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/launch?error=twitter_auth_denied`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/launch?error=invalid_callback`)
    }

    // Decode state parameter
    const stateData = JSON.parse(Buffer.from(state, "base64").toString())
    const { walletAddress } = stateData

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier: "challenge",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/launch?error=token_exchange_failed`)
    }

    // Get user information from Twitter
    const userResponse = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url,public_metrics,verified",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    )

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      console.error("User data fetch failed:", userData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/launch?error=user_data_failed`)
    }

    const user = userData.data

    // Store user data in Supabase
    const supabase = createServerSupabaseClient()

    const { data: existingUser } = await supabase.from("users").select("*").eq("wallet_address", walletAddress).single()

    const userProfileData = {
      wallet_address: walletAddress,
      display_name: user.name,
      twitter_username: user.username,
      twitter_id: user.id,
      profile_image: user.profile_image_url,
      follower_count: user.public_metrics?.followers_count || 0,
      following_count: user.public_metrics?.following_count || 0,
      tweet_count: user.public_metrics?.tweet_count || 0,
      is_verified: user.verified || false,
      verification_status: "twitter_verified",
    }

    if (existingUser) {
      await supabase.from("users").update(userProfileData).eq("wallet_address", walletAddress)
    } else {
      await supabase.from("users").insert({
        id: crypto.randomUUID(),
        ...userProfileData,
      })
    }

    // Redirect back to launch page with success
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/launch`)
    redirectUrl.searchParams.set("twitter_connected", "true")
    redirectUrl.searchParams.set("username", user.username)
    redirectUrl.searchParams.set("verified", user.verified.toString())

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error("Twitter callback error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/launch?error=callback_failed`)
  }
}
