import { NextResponse } from 'next/server';
import type { BiometricMetric, SummaryResponse } from '@aida/shared';
import { getUserById, type AuthUser } from '@/lib/auth-service';
import { collections, getDb, isMongoConfigured } from '@/lib/mongodb';
import { callSessionResponse, demoSummaryResponse } from '../../_mock/aida-demo';

const ELEVENLABS_OUTBOUND_CALL_URL = "https://api.elevenlabs.io/v1/convai/twilio/outbound-call";
const E164_PHONE_RE = /^\+[1-9]\d{7,14}$/;

type InitiateCallBody = {
  providerId?: string;
  patientId?: string;
  summaryId?: string;
  patientName?: string;
  language?: string;
  toNumber?: string;
};

type ElevenLabsOutboundCallResponse = {
  success?: boolean;
  message?: string;
  conversation_id?: string | null;
  callSid?: string | null;
};

type StoredSummary = SummaryResponse & {
  source?: "gemini" | "demo";
  approvedByPatient?: boolean;
  createdAt?: Date | string;
};

function resolveToNumber(body: InitiateCallBody) {
  return body.toNumber?.trim() || process.env.ELEVENLABS_DEFAULT_TO_NUMBER?.trim() || "";
}

function userDisplayName(user?: AuthUser): string | undefined {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return fullName || user?.name?.trim() || undefined;
}

async function resolvePatientContext(body: InitiateCallBody, fallbackPatientId: string) {
  const patientId = body.patientId?.trim() || fallbackPatientId;
  const result = patientId ? await getUserById(patientId).catch(() => null) : null;
  const user = result?.ok ? result.user : undefined;

  return {
    patientId,
    patientName: userDisplayName(user) || body.patientName?.trim() || "the patient",
    preferredLanguage: user?.language?.trim() || body.language?.trim() || "English",
  };
}

function normalizeSummary(doc: StoredSummary): StoredSummary {
  return {
    ...demoSummaryResponse,
    ...doc,
    summaryId: String(doc.summaryId || demoSummaryResponse.summaryId),
    patientId: String(doc.patientId || demoSummaryResponse.patientId),
    uploadId: String(doc.uploadId || demoSummaryResponse.uploadId),
    specialtyRecommendation: String(
      doc.specialtyRecommendation || demoSummaryResponse.specialtyRecommendation,
    ),
    urgency: doc.urgency || demoSummaryResponse.urgency,
    summary: String(doc.summary || demoSummaryResponse.summary),
    shareItems: Array.isArray(doc.shareItems) ? doc.shareItems : demoSummaryResponse.shareItems,
    biometricHighlights: Array.isArray(doc.biometricHighlights)
      ? doc.biometricHighlights
      : demoSummaryResponse.biometricHighlights,
  };
}

async function loadSummaryContext(patientId: string, summaryId?: string): Promise<StoredSummary> {
  if (!isMongoConfigured()) {
    return normalizeSummary({
      ...demoSummaryResponse,
      patientId,
      summaryId: summaryId?.trim() || demoSummaryResponse.summaryId,
      source: "demo",
    });
  }

  const db = await getDb();
  if (!db) {
    return normalizeSummary({
      ...demoSummaryResponse,
      patientId,
      summaryId: summaryId?.trim() || demoSummaryResponse.summaryId,
      source: "demo",
    });
  }

  const summaries = db.collection<StoredSummary>(collections.biometricSummaries);
  const trimmedSummaryId = summaryId?.trim();
  let summary = trimmedSummaryId
    ? await summaries.findOne({ summaryId: trimmedSummaryId, patientId })
    : null;

  if (!summary && trimmedSummaryId) {
    summary = await summaries.findOne({ summaryId: trimmedSummaryId });
  }

  if (!summary) {
    summary = await summaries
      .find({ patientId, source: "gemini" })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
  }

  if (!summary) {
    summary = await summaries
      .find({ patientId })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
  }

  return normalizeSummary(summary ?? {
    ...demoSummaryResponse,
    patientId,
    summaryId: trimmedSummaryId || demoSummaryResponse.summaryId,
    source: "demo",
  });
}

function formatFlaggedMetrics(metrics: BiometricMetric[]) {
  if (metrics.length === 0) return "No flagged biometric metrics were included.";
  return metrics
    .map((metric) => {
      const value = [metric.value, metric.unit].filter(Boolean).join(" ");
      return `${metric.label}: ${value} (${metric.detail})`;
    })
    .join("; ");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as InitiateCallBody;
  try {
    const providerId = body.providerId;
    const seedSession = callSessionResponse(providerId, body.patientName);
    const patient = await resolvePatientContext(body, seedSession.patientId);
    const summary = await loadSummaryContext(patient.patientId, body.summaryId);
    const baseSession = callSessionResponse(providerId, patient.patientName);
    const toNumber = resolveToNumber(body);
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const agentPhoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;
    const liveCallsEnabled = process.env.ELEVENLABS_LIVE_CALLS === "true";
    const appointmentReason = summary.specialtyRecommendation || baseSession.appointment.specialty;
    const medicalSummary = summary.summary || demoSummaryResponse.summary;
    const flaggedMetrics = formatFlaggedMetrics(summary.biometricHighlights);

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
          patientId: patient.patientId,
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
            patient_name: patient.patientName,
            clinic_name: baseSession.clinicName,
            provider_name: baseSession.appointment.doctor,
            specialty: baseSession.appointment.specialty,
            appointment_reason: appointmentReason,
            preferred_language: patient.preferredLanguage,
            medical_summary: medicalSummary,
            biometric_summary: medicalSummary,
            flagged_metrics: flaggedMetrics,
            summary_id: summary.summaryId,
            summary_source: summary.source ?? "database",
            patient_id: patient.patientId,
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
        patientId: patient.patientId,
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
        ...callSessionResponse(body.providerId, body.patientName),
        toNumber: process.env.ELEVENLABS_DEFAULT_TO_NUMBER,
        liveCall: false,
        warning: "Live call initiation failed; returned demo call session.",
      },
    });
  }
}
