import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const res = await fetch('https://api.circle.com/v1/stablecoinKits/swap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Kit-Key': process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY!,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}