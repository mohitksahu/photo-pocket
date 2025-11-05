import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePassword } from '@/lib/utils'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, phoneNumber } = await request.json()

    if (!name || !phoneNumber) {
      return NextResponse.json({ error: 'Name and phoneNumber are required' }, { status: 400 })
    }

    // Check if student already exists
    const existing = await prisma.student.findUnique({
      where: { phoneNumber }
    })

    if (existing) {
      return NextResponse.json({ error: 'Student with this phoneNumber already exists' }, { status: 400 })
    }

    const password = generatePassword()
    const hashedPassword = await hashPassword(password)

    const student = await prisma.student.create({
      data: {
        name,
        phoneNumber,
        password: hashedPassword,
        paymentStatus: 'UNPAID',
        photoStatus: 'Pending',
      }
    })

    return NextResponse.json({ student: { id: student.id, name: student.name, phoneNumber: student.phoneNumber, paymentStatus: student.paymentStatus, password } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}