import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { rollNo, status } = await request.json()

    if (!rollNo || !status) {
      return NextResponse.json({ error: 'rollNo and status are required' }, { status: 400 })
    }

    await prisma.student.update({
      where: { rollNo },
      data: { photoStatus: status }
    })

    return NextResponse.json({ message: 'Status updated' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}