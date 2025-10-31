import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        rollNo: true,
        paymentStatus: true,
        photoStatus: true
      }
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}