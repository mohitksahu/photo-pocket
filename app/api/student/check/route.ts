import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const existing = await prisma.student.findUnique({
      where: { phoneNumber }
    })

    if (existing) {
      return NextResponse.json({ exists: true, message: 'Phone number already registered' })
    } else {
      return NextResponse.json({ exists: false, message: 'Phone number is available' })
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}