import { NextRequest, NextResponse } from 'next/server'
import imagekit from '@/lib/imagekit'

export async function POST(request: NextRequest) {
  try {
    const { rollNo } = await request.json()

    if (!rollNo) {
      return NextResponse.json({ error: 'rollNo is required' }, { status: 400 })
    }

    // Generate auth params for upload to /photos/{rollNo}/
    const authParams = imagekit.getAuthenticationParameters()

    return NextResponse.json({
      ...authParams,
      folder: `/photos/${rollNo}/`
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}