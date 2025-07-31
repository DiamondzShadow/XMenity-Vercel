import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient()

    // Get user from session (in a real app, you'd verify the JWT token)
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile with related data
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        *,
        tokens!tokens_creator_id_fkey (
          id,
          name,
          symbol,
          contract_address,
          total_supply,
          holder_count
        ),
        token_holdings (
          balance,
          tokens (
            name,
            symbol,
            logo_url
          )
        )
      `)
      .eq("id", authUser.id)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { displayName, bio, profileImage } = await request.json()
    const supabase = createServerComponentClient()

    // Get user from session
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        display_name: displayName,
        bio,
        profile_image: profileImage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authUser.id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
