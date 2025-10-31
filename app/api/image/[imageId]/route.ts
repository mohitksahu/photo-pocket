import { NextRequest, NextResponse } from 'next/server'
import imagekit from '@/lib/imagekit'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    // Check admin auth
    const cookie = request.cookies.get('admin-auth')
    if (!cookie || cookie.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageId } = await params

    await imagekit.deleteFile(imageId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete error:', error)
    // If file doesn't exist or any error, consider it deleted (idempotent operation)
    return NextResponse.json({ success: true })
  }
}