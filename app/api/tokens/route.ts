import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const skip = (page - 1) * limit

    const where = {
      isPublic: true,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { symbol: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where,
        include: {
          creator: {
            select: {
              displayName: true,
              twitterUsername: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.token.count({ where })
    ])

    return NextResponse.json({
      success: true,
      tokens,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch tokens:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch tokens" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth(request)

    const body = await request.json()
    const {
      name,
      symbol,
      description,
      logoUrl,
      contractAddress,
      mintingRule,
      mintAmount,
      maxSupply,
    } = body

    if (!name || !symbol || !contractAddress) {
      return NextResponse.json({ error: "Missing required fields: name, symbol, or contractAddress" }, { status: 400 })
    }

    // Check symbol uniqueness
    const existingSymbolToken = await prisma.token.findFirst({
      where: { symbol: symbol.toUpperCase() }
    })
    if (existingSymbolToken) {
      return NextResponse.json({ error: "Token symbol already exists" }, { status: 400 })
    }

    const token = await prisma.token.create({
      data: {
        name,
        symbol: symbol.toUpperCase(),
        description,
        logoUrl,
        contractAddress: contractAddress.toLowerCase(),
        mintingRule: mintingRule || 'manual',
        mintAmount: BigInt(mintAmount || 1),
        maxSupply: maxSupply ? BigInt(maxSupply) : null,
        creatorId: user.id,
      },
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'token_created',
        description: `Token ${name} (${symbol}) was created`,
        userId: user.id,
        tokenId: token.id,
      },
    })

    return NextResponse.json(token, { status: 201 })
  } catch (error) {
    console.error("Failed to create token:", error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
