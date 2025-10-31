import { NextRequest, NextResponse } from 'next/server'
import { getStudentFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import imagekit from '@/lib/imagekit'

export async function GET(request: NextRequest) {
  try {
    const studentData = await getStudentFromCookie()
    if (!studentData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rollNo } = studentData

    const student = await prisma.student.findUnique({
      where: { rollNo },
      select: { photoStatus: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.photoStatus !== 'Ready') {
      return NextResponse.json({ message: 'Your photos are being processed! Please check back soon.', status: student.photoStatus })
    }

    // List files in /photos/{rollNo}/
    const files = await imagekit.listFiles({
      path: `/photos/${rollNo}`,
      sort: 'ASC_CREATED'
    })

    // Filter to only files
    const fileObjects = files.filter((item): item is any => 'filePath' in item)

    // Generate signed URLs
    const photos = fileObjects.map(file => ({
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