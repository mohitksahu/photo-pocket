import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePassword } from '@/lib/utils'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, rollNo } = await request.json()

    if (!name || !rollNo) {
      return NextResponse.json({ error: 'Name and rollNo are required' }, { status: 400 })
    }

    // Check if student already exists
    const existing = await prisma.student.findUnique({
      where: { rollNo }
    })

    if (existing) {
      return NextResponse.json({ error: 'Student with this rollNo already exists' }, { status: 400 })
    }

    const password = generatePassword()
    const hashedPassword = await hashPassword(password)

    const student = await prisma.student.create({
      data: {
        name,
        rollNo,
        password: hashedPassword,
        paymentStatus: 'UNPAID',
        photoStatus: 'Pending',
      }
    })

    return NextResponse.json({ student: { id: student.id, name: student.name, rollNo: student.rollNo, paymentStatus: student.paymentStatus, password } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}