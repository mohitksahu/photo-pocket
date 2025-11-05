import { NextRequest, NextResponse } from 'next/server'
import imagekit from '@/lib/imagekit'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 })
    }

    // Generate auth params for upload to /photos/{phoneNumber}/
    // Remove + and spaces from phone number for folder name (ImageKit doesn't accept + in folder names)
    const folderName = phoneNumber.replace(/[\+\s]/g, '')
    console.log('Auth request for phone:', phoneNumber, '-> folder:', `photos/${folderName}/`)
    const authParams = imagekit.getAuthenticationParameters()
    
    console.log('Generated auth params for:', phoneNumber, {
      hasSignature: !!authParams.signature,
      hasToken: !!authParams.token,
      expire: authParams.expire,
      folder: `photos/${folderName}/`,
      originalPhone: phoneNumber
    })

    return NextResponse.json({
      ...authParams,
      folder: `photos/${folderName}/`
    })
  } catch (error) {
    console.error('ImageKit auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}