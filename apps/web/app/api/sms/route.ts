import { NextResponse } from 'next/server';
import { demoSmsResponse } from '../_mock/aida-demo';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    data: {
      ...demoSmsResponse,
      appointmentId: body.appointmentId ?? demoSmsResponse.appointmentId,
    },
  });
}
