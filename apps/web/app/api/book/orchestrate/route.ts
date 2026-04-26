import { NextResponse } from "next/server";
import { callAsi1Agent } from "@/lib/asi1";
import { parseAgentJsonResponse } from "@/lib/fetchai";

type OrchestrateBody = {
  patientId?: string;
  language?: string;
  specialty?: string;
  location?: string;
  summary?: string;
  patientText?: string;
  insurance?: {
    carrier?: string;
    plan?: string;
    memberId?: string;
    groupNumber?: string;
  };
};

function demoOrchestration(body: OrchestrateBody) {
  return {
    answer:
      "Aida found an in-network cardiology option, verified insurance, prepared English clinic intake, and produced patient-language confirmation text.",
    insurance: {
      eligible: true,
      carrier: body.insurance?.carrier ?? "Aetna",
      plan: body.insurance?.plan ?? "Choice POS II",
      estimated_copay: 25,
      network_status: "in-network",
    },
    scheduler: {
      recommended_visit: "Cardiology screening recommended based on elevated resting heart rate, lower HRV, and fatigue.",
      providers: [
        {
          id: "clinic-mission-heart",
          name: "Mission Heart & Vascular",
          doctor: "Dr. Ruth Okonkwo",
          specialty: "Cardiology",
          next_available: "2026-05-07T09:00:00-07:00",
          network_status: "in-network",
        },
      ],
    },
    translator: {
      clinic_ready_english:
        "Patient reports fatigue for three days with wearable data showing elevated resting heart rate, lower HRV, and reduced sleep.",
      patient_language_receipt:
        body.language === "Mandarin" || body.language === "Chinese"
          ? "Aida 正在联系诊所以确认您的预约。"
          : "Aida is contacting the clinic to confirm your appointment.",
    },
    next_action: "Trigger ElevenLabs outbound call to confirm the selected slot with the clinic.",
    agentStatus: "demo",
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as OrchestrateBody;
  const agentAddress = process.env.FETCHAI_ORCHESTRATOR_AGENT_ADDRESS;
  if (!agentAddress) {
    return NextResponse.json({ ok: true, data: demoOrchestration(body) });
  }

  const payload = {
    patient_id: body.patientId ?? "patient-demo",
    language: body.language ?? "Mandarin",
    specialty: body.specialty ?? "cardiology",
    location: body.location ?? "Los Angeles, CA",
    patient_text:
      body.patientText ??
      "I have felt tired for three days and my watch says my resting heart rate is high.",
    summary:
      body.summary ??
      "Resting HR 78 bpm, HRV 42 ms, sleep score 65/100, fatigue for three days.",
    insurance_details: {
      carrier: body.insurance?.carrier ?? "Aetna",
      plan: body.insurance?.plan ?? "Choice POS II",
      member_id: body.insurance?.memberId ?? "DEMO-482-19-7720",
      group_number: body.insurance?.groupNumber ?? "884216",
    },
  };

  try {
    const response = await callAsi1Agent({
      agentAddress,
      sessionId: `aida-orchestrate-${body.patientId ?? "demo"}`,
      prompt: `book_medical_appointment ${JSON.stringify(payload)}`,
    });
    const parsed = parseAgentJsonResponse(response.text);
    return NextResponse.json({
      ok: true,
      data: parsed
        ? { ...parsed, agentStatus: "asi1-agent", agentAddress }
        : { ...demoOrchestration(body), answer: response.text, agentStatus: "asi1-text", agentAddress },
    });
  } catch (error) {
    console.error("[Fetch.ai] Orchestrator agent error:", error);
    return NextResponse.json({
      ok: true,
      data: { ...demoOrchestration(body), agentStatus: "fallback", agentAddress },
    });
  }
}

