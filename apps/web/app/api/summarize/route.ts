import { NextResponse } from 'next/server';
import { generateBiometricSummary, type SummaryRequestBody } from '@/lib/summary-service';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as SummaryRequestBody;

  try {
    const { data } = await generateBiometricSummary(body);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Gemini API processing failed. ' + String(error) },
      { status: 500 },
    );
  }
}
