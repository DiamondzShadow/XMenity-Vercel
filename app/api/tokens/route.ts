import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()

// Custom error classes
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) {
    throw new AuthenticationError('Access token required')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        walletAddress: true,
        isActive: true,
        isVerified: true,
      }
    })

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive')
    }

    return user
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new AuthenticationError('Invalid token')
  }
}

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
    const user = await verifyToken(request)

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
      throw new ValidationError("Missing required fields: name, symbol, or contractAddress")
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

    return NextResponse.json({
      success: true,
      token,
    })
  } catch (error) {
    console.error("Failed to create token:", error)
    
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 })
    }
    
    if (error instanceof ValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: false, error: "Failed to create token" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
