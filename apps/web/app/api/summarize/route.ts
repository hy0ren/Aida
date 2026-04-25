import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { demoSummaryResponse } from '../_mock/aida-demo';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY missing, falling back to mock summary");
    return NextResponse.json({
      ok: true,
      data: {
        ...demoSummaryResponse,
        uploadId: body.uploadId ?? demoSummaryResponse.uploadId,
      },
    });
  }

  const anthropic = new Anthropic();

  try {
    // We expect the payload from ZETIC Melange to be a JSON string of vital stats and a selected language.
    const promptData = body.biometrics ? JSON.stringify(body.biometrics) : "No biometric data provided.";
    const targetLanguage = body.language || 'English';

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      system: `You are Aida, an AI medical summarizer. Summarize the following on-device preprocessed biometric data in a non-clinical, reassuring way for the patient. Highlight flagged metrics. The summary must be natively written in ${targetLanguage}. Keep it under 3 paragraphs. Don't include markdown formatting.`,
      messages: [
        { role: "user", content: promptData }
      ],
    });

    // We use demo biometric highlights for structure and plug in Claude's plain-language summary
    return NextResponse.json({
      ok: true,
      data: {
        ...demoSummaryResponse,
        summaryId: "sum-" + Math.random().toString(36).substring(7),
        uploadId: body.uploadId ?? demoSummaryResponse.uploadId,
        summary: msg.content[0].type === "text" ? msg.content[0].text : demoSummaryResponse.summary,
      },
    });
  } catch (error) {
    console.error("Anthropic Error API:", error);
    return NextResponse.json({ ok: false, error: "Anthropic API processing failed. " + String(error) }, { status: 500 });
  }
}
