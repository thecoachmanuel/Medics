import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

export async function POST(request: Request) {
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Missing Cloudinary configuration' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({})) as { folder?: string }
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = body.folder || 'medimeet'

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })

  const paramsToSign: Record<string, string | number> = { timestamp, folder }
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret)

  return NextResponse.json({ timestamp, signature, apiKey, cloudName, folder })
}

