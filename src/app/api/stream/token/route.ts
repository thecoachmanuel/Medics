
import { NextRequest, NextResponse } from 'next/server';
import { StreamClient } from '@stream-io/node-sdk';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const secret = process.env.STREAM_SECRET_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  if (!apiKey || !secret) {
    return NextResponse.json({ error: 'Stream keys are missing' }, { status: 500 });
  }

  const client = new StreamClient(apiKey, secret);
  const token = client.createToken(userId, Math.floor(Date.now() / 1000) + 3600);

  return NextResponse.json({ token });
}
