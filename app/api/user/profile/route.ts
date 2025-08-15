import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { requireAuth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        createdTokens: {
          select: {
            id: true,
            name: true,
            symbol: true,
            contractAddress: true,
            totalSupply: true,
            holderCount: true,
          },
        },
        tokenHoldings: {
          include: {
            token: {
              select: {
                name: true,
                symbol: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    })

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { displayName, bio, profileImage } = await request.json()

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName,
        bio,
        profileImage,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
