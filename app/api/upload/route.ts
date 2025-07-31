import { type NextRequest, NextResponse } from "next/server"
import { storageOperations } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const tokenId = formData.get("tokenId") as string

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only images are allowed." },
        { status: 400 },
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 5MB." }, { status: 400 })
    }

    let downloadUrl: string

    if (tokenId) {
      // Upload token logo
      downloadUrl = await storageOperations.uploadTokenLogo(file, tokenId)
    } else {
      // General file upload
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      downloadUrl = await storageOperations.uploadFile(file, `uploads/${fileName}`)
    }

    return NextResponse.json({
      success: true,
      url: downloadUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json({ success: false, error: "Failed to upload file" }, { status: 500 })
  }
}
