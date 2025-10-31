import { NextRequest, NextResponse } from 'next/server'
import imagekit from '@/lib/imagekit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rollNo: string }> }
) {
  try {
    // Check admin auth - simple check for cookie
    const cookie = request.cookies.get('admin-auth')
    if (!cookie || cookie.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rollNo } = await params

    // List files in /photos/{rollNo}/
    const files = await imagekit.listFiles({
      path: `/photos/${rollNo}`,
      sort: 'ASC_CREATED'
    })

    // Filter to only files
    const fileObjects = files.filter((item): item is any => 'fileId' in item)

    // Generate signed URLs
    const photos = fileObjects.map(file => ({
      id: file.fileId,
      name: file.name,
      url: imagekit.url({
        path: file.filePath,
        signed: true,
        expireSeconds: 600 // 10 minutes
      })
    }))

    return NextResponse.json({ photos })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}