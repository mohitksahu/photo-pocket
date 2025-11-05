import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import imagekit from '@/lib/imagekit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> }
) {
  try {
    const { phoneNumber } = await params

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { phoneNumber },
      select: { photoStatus: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.photoStatus !== 'Ready') {
      return NextResponse.json({ message: 'Photos are being processed! Please check back soon.', status: student.photoStatus })
    }

    // List files in /photos/{phoneNumber}/
    // Remove + and spaces from phone number for folder name
    const folderName = phoneNumber.replace(/[\+\s]/g, '')
    console.log('Listing files for phone:', phoneNumber, 'folder:', `photos/${folderName}`)
    const files = await imagekit.listFiles({
      path: `photos/${folderName}`,
      sort: 'ASC_CREATED'
    })
    console.log('Found files:', files.length, files.map(f => 'filePath' in f ? f.filePath : f.name))

    // Filter to only files
    const fileObjects = files.filter((item): item is any => 'filePath' in item)
    console.log('Filtered to file objects:', fileObjects.length)

    // Generate signed URLs
    const photos = fileObjects.map(file => ({
      id: file.fileId,
      name: file.name,
      url: imagekit.url({
        path: file.filePath,
        signed: true,
        expireSeconds: 3600 // 1 hour
      })
    }))

    return NextResponse.json({ photos })
  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}