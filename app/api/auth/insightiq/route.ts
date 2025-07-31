import { type NextRequest, NextResponse } from "next/server"
import { insightIQClient } from "@/lib/insightiq"

export async function POST(request: NextRequest) {
  try {
    const { username, platform = "twitter" } = await request.json()

    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required" }, { status: 400 })
    }

    const result = await insightIQClient.verifyCreator(username, platform)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Verification failed" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      profile: result.data,
      verified: result.data?.verified || false,
    })
  } catch (error) {
    console.error("InsightIQ verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")
    const platform = searchParams.get("platform") || "twitter"
    const metricsParam = searchParams.get("metrics")

    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required" }, { status: 400 })
    }

    if (metricsParam) {
      const metrics = metricsParam.split(",")
      const result = await insightIQClient.getMetrics(username, platform, metrics)

      return NextResponse.json({
        success: true,
        username,
        platform,
        metrics: result,
      })
    } else {
      const result = await insightIQClient.verifyCreator(username, platform)

      return NextResponse.json({
        success: result.success,
        profile: result.data,
        error: result.error,
      })
    }
  } catch (error) {
    console.error("InsightIQ API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
