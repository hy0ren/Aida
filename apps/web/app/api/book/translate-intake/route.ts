import { NextResponse } from "next/server";
import { callAsi1Agent } from "@/lib/asi1";
import { parseAgentJsonResponse } from "@/lib/fetchai";

type TranslateIntakeBody = {
  patientId?: string;
  language?: string;
  patientText?: string;
  summary?: string;
};

function demoTranslation(body: TranslateIntakeBody) {
  return {
    detectedLanguage: body.language ?? "Mandarin",
    clinicReadyEnglish:
      "Patient reports fatigue for three days with wearable data showing elevated resting heart rate, lower HRV, and reduced sleep.",
    patientLanguageReceipt:
      body.language === "Mandarin" || body.language === "Chinese"
        ? "Aida 正在联系诊所以确认您的预约。"
        : "Aida is contacting the clinic to confirm your appointment.",
    agentStatus: "demo",
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as TranslateIntakeBody;
  const agentAddress = process.env.FETCHAI_TRANSLATOR_AGENT_ADDRESS;
  if (!agentAddress) return NextResponse.json({ ok: true, data: demoTranslation(body) });

  try {
    const response = await callAsi1Agent({
      agentAddress,
      sessionId: `aida-translate-${body.patientId ?? "demo"}`,
      prompt: `translate_intake ${JSON.stringify({
        patient_id: body.patientId,
        language: body.language ?? "Mandarin",
        patient_text: body.patientText ?? "",
        summary: body.summary ?? "",
      })}`,
    });
    const parsed = parseAgentJsonResponse(response.text);
    return NextResponse.json({
      ok: true,
      data: parsed
        ? { ...parsed, agentStatus: "asi1-agent", agentAddress }
        : { ...demoTranslation(body), agentStatus: "asi1-text", answer: response.text, agentAddress },
    });
  } catch (error) {
    console.error("[Fetch.ai] Translator agent error:", error);
    return NextResponse.json({
      ok: true,
      data: { ...demoTranslation(body), agentStatus: "fallback", agentAddress },
    });
  }
}

