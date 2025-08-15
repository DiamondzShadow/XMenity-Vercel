import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { requireAuth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const { id } = params

    const notification = await prisma.notification.update({
      where: {
        id,
        userId: user.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Notification update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}