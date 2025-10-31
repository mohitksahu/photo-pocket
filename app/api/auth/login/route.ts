import { NextRequest, NextResponse } from 'next/server'
import { comparePassword, setAuthCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { rollNo, password } = await request.json()

    if (!rollNo || !password) {
      return NextResponse.json({ error: 'Roll No and password are required' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { rollNo }
    })

    if (!student || student.paymentStatus !== 'PAID') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await comparePassword(password, student.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await setAuthCookie(rollNo)

    return NextResponse.json({ message: 'Login successful' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}