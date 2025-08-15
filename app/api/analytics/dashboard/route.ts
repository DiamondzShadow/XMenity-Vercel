import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userId = user.id

    // Get user's created tokens count
    const tokensCreated = await prisma.token.count({
      where: { creatorId: userId },
    })

    // Get total token supply across all user's tokens
    const userTokens = await prisma.token.findMany({
      where: { creatorId: userId },
      select: { totalSupply: true },
    })

    const totalSupply = userTokens.reduce((sum, token) => sum + Number(token.totalSupply), 0)

    // Get total transactions
    const totalTransactions = await prisma.transaction.count({
      where: { userId },
    })

    // Get recent activities
    const recentActivities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        token: {
          select: { name: true, symbol: true },
        },
      },
    })

    return NextResponse.json({
      tokensCreated,
      totalSupply,
      totalTransactions,
      recentActivities,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Analytics fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
