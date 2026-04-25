import { NextResponse } from 'next/server';
import { demoUploadResponse } from '../_mock/aida-demo';

export async function POST(req: Request) {
  await req.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    data: demoUploadResponse,
  });
}
