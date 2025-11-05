import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { generatePassword } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, polaroidQuantity, albumQuantity } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { phoneNumber }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Student already paid' }, { status: 400 })
    }

    const plainPassword = generatePassword()
    const hashedPassword = await hashPassword(plainPassword)

    await prisma.student.update({
      where: { phoneNumber },
      data: ({
        paymentStatus: 'PAID',
        password: hashedPassword,
        plainPassword: plainPassword,
        ...(polaroidQuantity !== undefined ? { polaroidQuantity: polaroidQuantity } : {}),
        ...(albumQuantity !== undefined ? { albumQuantity: albumQuantity } : {}),
      } as any)
    })

    return NextResponse.json({ password: plainPassword })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}