import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, status } = await request.json()

    if (!phoneNumber || !status) {
      return NextResponse.json({ error: 'phoneNumber and status are required' }, { status: 400 })
    }

    await prisma.student.update({
      where: { phoneNumber },
      data: { photoStatus: status }
    })

    return NextResponse.json({ message: 'Status updated' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}