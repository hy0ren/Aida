import { NextResponse } from 'next/server';
import {
  generateBiometricSummary,
  listSummariesByPatientId,
  type SummaryRequestBody,
} from '@/lib/summary-service';

export async function GET(req: Request) {
  const patientId = new URL(req.url).searchParams.get('patientId');
  if (!patientId?.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Query parameter patientId is required' },
      { status: 400 },
    );
  }

  try {
    const { data } = await listSummariesByPatientId(patientId.trim());
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Summary history fetch error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to list AI summaries.' },
      { status: 500 },
    );
  }
}

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
