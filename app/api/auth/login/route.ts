import { NextRequest, NextResponse } from 'next/server'
import { comparePassword, setAuthCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, password } = await request.json()

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: 'Phone Number and password are required' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { phoneNumber }
    })

    if (!student || student.paymentStatus !== 'PAID') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await comparePassword(password, student.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await setAuthCookie(phoneNumber)

    return NextResponse.json({ message: 'Login successful' })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}