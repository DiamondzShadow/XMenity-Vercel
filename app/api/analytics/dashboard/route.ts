import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient()

    // Get user from session
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get tokens created count
    const { count: tokensCreated } = await supabase
      .from("tokens")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", authUser.id)

    // Get user's tokens for total supply calculation
    const { data: userTokens } = await supabase.from("tokens").select("total_supply").eq("creator_id", authUser.id)

    const totalSupply = userTokens?.reduce((sum, token) => sum + Number.parseInt(token.total_supply || "0"), 0) || 0

    // Get total transactions
    const { count: totalTransactions } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authUser.id)

    // Get recent activities
    const { data: recentActivities } = await supabase
      .from("activities")
      .select(`
        *,
        tokens (
          name,
          symbol
        )
      `)
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(10)

    return NextResponse.json({
      tokensCreated: tokensCreated || 0,
      totalSupply,
      totalTransactions: totalTransactions || 0,
      recentActivities: recentActivities || [],
    })
  } catch (error) {
    console.error("Analytics fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
