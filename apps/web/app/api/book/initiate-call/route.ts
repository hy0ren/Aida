import { NextResponse } from 'next/server';
import { callSessionResponse } from '../../_mock/aida-demo';

const ELEVENLABS_OUTBOUND_CALL_URL = "https://api.elevenlabs.io/v1/convai/twilio/outbound-call";
const E164_PHONE_RE = /^\+[1-9]\d{7,14}$/;

type InitiateCallBody = {
  providerId?: string;
  patientId?: string;
  summaryId?: string;
  toNumber?: string;
};

type ElevenLabsOutboundCallResponse = {
  success?: boolean;
  message?: string;
  conversation_id?: string | null;
  callSid?: string | null;
};

function resolveToNumber(body: InitiateCallBody) {
  return body.toNumber?.trim() || process.env.ELEVENLABS_DEFAULT_TO_NUMBER?.trim() || "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as InitiateCallBody;
    const providerId = body.providerId;
    const baseSession = callSessionResponse(providerId);
    const toNumber = resolveToNumber(body);
    
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const agentPhoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;
    const liveCallsEnabled = process.env.ELEVENLABS_LIVE_CALLS === "true";

    if (!E164_PHONE_RE.test(toNumber)) {
      return NextResponse.json(
        { ok: false, error: "Set ELEVENLABS_DEFAULT_TO_NUMBER in apps/web/.env.local using E.164 format, for example +17143921298." },
        { status: 400 },
      );
    }

    if (!liveCallsEnabled || !apiKey || !agentId || !agentPhoneNumberId) {
      console.warn("ElevenLabs live calls disabled or credentials missing. Falling back to mock call session.");
      return NextResponse.json({
        ok: true,
        data: {
          ...baseSession,
          toNumber,
          liveCall: false,
          warning: liveCallsEnabled
            ? "Missing ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, or ELEVENLABS_AGENT_PHONE_NUMBER_ID."
            : "Set ELEVENLABS_LIVE_CALLS=true to place a live ElevenLabs call.",
        },
      });
    }

    const response = await fetch(ELEVENLABS_OUTBOUND_CALL_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: agentPhoneNumberId,
        to_number: toNumber,
        conversation_initiation_client_data: {
          dynamic_variables: {
            patient_name: "Elena Morales",
            clinic_name: baseSession.clinicName,
            provider_name: baseSession.appointment.doctor,
            specialty: baseSession.appointment.specialty,
            appointment_reason: "Elevated resting heart rate and fatigue",
            preferred_language: "Spanish",
            summary_id: body.summaryId ?? "",
            patient_id: body.patientId ?? baseSession.patientId,
          },
        },
      })
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error("Failed to initiate ElevenLabs call: " + responseText);
    }

    const elevenLabsData = JSON.parse(responseText) as ElevenLabsOutboundCallResponse;
    
    return NextResponse.json({
      ok: true,
      data: {
        ...baseSession,
        callSessionId: elevenLabsData.conversation_id ?? baseSession.callSessionId,
        elevenLabsConversationId: elevenLabsData.conversation_id ?? undefined,
        callSid: elevenLabsData.callSid ?? undefined,
        toNumber,
        liveCall: true,
        status: 'calling',
      },
    });

  } catch (error) {
    console.error("ElevenLabs Error:", error);
    return NextResponse.json({
      ok: true,
      data: {
        ...callSessionResponse(),
        toNumber: process.env.ELEVENLABS_DEFAULT_TO_NUMBER,
        liveCall: false,
        warning: "Live call initiation failed; returned demo call session.",
      },
    });
  }
}
