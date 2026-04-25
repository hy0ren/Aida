import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { demoSummaryResponse } from '../_mock/aida-demo';

const MODEL_NAME = 'gemini-2.5-flash-lite';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY missing, falling back to mock summary');
    return NextResponse.json({
      ok: true,
      data: {
        ...demoSummaryResponse,
        uploadId: body.uploadId ?? demoSummaryResponse.uploadId,
      },
    });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const promptData = body.biometrics
      ? JSON.stringify(body.biometrics)
      : 'No biometric data provided.';
    const targetLanguage = body.language || 'English';

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptData,
      config: {
        systemInstruction: `You are Aida, an AI medical summarizer. Summarize the following on-device preprocessed biometric data in a non-clinical, reassuring way for the patient. Highlight flagged metrics. The summary must be natively written in ${targetLanguage}. Keep it under 3 paragraphs. Don't include markdown formatting.`,
        maxOutputTokens: 1024,
      },
    });

    const summaryText = response.text?.trim();

    return NextResponse.json({
      ok: true,
      data: {
        ...demoSummaryResponse,
        summaryId: 'sum-' + Math.random().toString(36).substring(7),
        uploadId: body.uploadId ?? demoSummaryResponse.uploadId,
        summary: summaryText && summaryText.length > 0
          ? summaryText
          : demoSummaryResponse.summary,
      },
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Gemini API processing failed. ' + String(error) },
      { status: 500 },
    );
  }
}
