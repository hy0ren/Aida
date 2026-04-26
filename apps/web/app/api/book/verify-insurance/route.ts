import { NextResponse } from 'next/server';
import { verifyInsuranceResponse, demoInsurance } from '../../_mock/aida-demo';
import type { InsuranceVerificationResponse, InsuranceProfile } from '@aida/shared';
import { collections, getDb, isMongoConfigured } from '@/lib/mongodb';

const AGENTVERSE_BASE = "https://agentverse.ai/v1beta1/almanac/agents";

type VerifyInsuranceBody = {
  providerId?: string;
  patientId?: string;
  insurance?: Partial<InsuranceProfile>;
};

type AgentResponse = {
  eligible?: boolean;
  carrier?: string;
  plan?: string;
  member_id?: string;
  group_number?: string;
  estimated_copay?: number;
  network_status?: string;
  message?: string;
  [key: string]: unknown;
};

async function loadLatestUploadedInsurance(patientId?: string): Promise<Partial<InsuranceProfile> | undefined> {
  if (!patientId?.trim() || !isMongoConfigured()) return undefined;
  const db = await getDb();
  if (!db) return undefined;

  const doc = await db.collection(collections.uploads).findOne(
    { patientId },
    {
      sort: { createdAt: -1 },
      projection: { _id: 0, insurance: 1 },
    },
  );
  const insurance = doc?.insurance;
  return insurance && typeof insurance === "object"
    ? (insurance as Partial<InsuranceProfile>)
    : undefined;
}

function resolveInsurance(
  requestInsurance?: Partial<InsuranceProfile>,
  storedInsurance?: Partial<InsuranceProfile>,
): InsuranceProfile {
  return {
    carrier: requestInsurance?.carrier ?? storedInsurance?.carrier ?? demoInsurance.carrier,
    plan: requestInsurance?.plan ?? storedInsurance?.plan ?? demoInsurance.plan,
    memberId: requestInsurance?.memberId ?? storedInsurance?.memberId ?? demoInsurance.memberId,
    groupNumber: requestInsurance?.groupNumber ?? storedInsurance?.groupNumber ?? demoInsurance.groupNumber,
    payerPhone: requestInsurance?.payerPhone ?? storedInsurance?.payerPhone ?? demoInsurance.payerPhone,
    network: requestInsurance?.network ?? storedInsurance?.network ?? demoInsurance.network,
    estimatedCopay:
      requestInsurance?.estimatedCopay ??
      storedInsurance?.estimatedCopay ??
      demoInsurance.estimatedCopay,
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as VerifyInsuranceBody;
  const agentAddress = process.env.FETCHAI_INSURANCE_AGENT_ADDRESS;
  const apiKey = process.env.FETCHAI_API_KEY;
  const demoFallback = verifyInsuranceResponse(body.providerId);
  let storedInsurance: Partial<InsuranceProfile> | undefined;
  try {
    storedInsurance = await loadLatestUploadedInsurance(body.patientId);
  } catch (error) {
    console.warn("[MongoDB] Could not load latest parsed insurance:", error);
  }
  const resolvedInsurance = resolveInsurance(body.insurance, storedInsurance);

  if (!agentAddress || !apiKey) {
    console.warn("[Fetch.ai] Insurance agent credentials missing — returning local insurance verification fallback.");
    return NextResponse.json({
      ok: true,
      data: {
        ...demoFallback,
        patientId: body.patientId ?? demoFallback.patientId,
        insurance: resolvedInsurance,
        message:
          storedInsurance || body.insurance
            ? `${resolvedInsurance.carrier} ${resolvedInsurance.plan} was parsed from the intake card. Agent verification still needs Fetch.ai credentials.`
            : demoFallback.message,
      },
    });
  }

  try {
    const chatPayload = {
      payload: {
        type: "chat",
        user_intent: "verify_insurance",
        provider_id: body.providerId,
        patient_id: body.patientId,
        insurance_details: {
          carrier: resolvedInsurance.carrier,
          plan: resolvedInsurance.plan,
          member_id: resolvedInsurance.memberId,
          group_number: resolvedInsurance.groupNumber,
        },
      },
    };

    console.log("[Fetch.ai] Sending verify-insurance request to insurance agent:", agentAddress);

    const response = await fetch(`${AGENTVERSE_BASE}/${agentAddress}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatPayload),
    });

    const responseText = await response.text();
    console.log("[Fetch.ai] Insurance agent status:", response.status, "body:", responseText.slice(0, 500));

    if (!response.ok) {
      console.warn("[Fetch.ai] Insurance agent returned", response.status, "— using demo verification.");
      return NextResponse.json({
        ok: true,
        data: { ...demoFallback, insurance: resolvedInsurance, agentStatus: "error", agentAddress },
      });
    }

    let agentData: AgentResponse | null = null;
    try {
      agentData = JSON.parse(responseText) as AgentResponse;
    } catch {
      // non-JSON response from agent
    }

    const hasAgentResult = agentData && typeof agentData.eligible === "boolean";

    const data: InsuranceVerificationResponse & { agentStatus: string; agentAddress: string } = {
      verificationId: demoFallback.verificationId,
      patientId: body.patientId ?? demoFallback.patientId,
      providerId: body.providerId ?? demoFallback.providerId,
      insurance: hasAgentResult
        ? {
            carrier: agentData!.carrier ?? resolvedInsurance.carrier,
            plan: agentData!.plan ?? resolvedInsurance.plan,
            memberId: agentData!.member_id ?? resolvedInsurance.memberId,
            groupNumber: agentData!.group_number ?? resolvedInsurance.groupNumber,
            payerPhone: resolvedInsurance.payerPhone,
            network: agentData!.network_status ?? resolvedInsurance.network,
            estimatedCopay: agentData!.estimated_copay ?? resolvedInsurance.estimatedCopay,
          }
        : resolvedInsurance,
      eligible: hasAgentResult ? agentData!.eligible! : demoFallback.eligible,
      status: hasAgentResult
        ? (agentData!.eligible ? "verified" : "needs-review")
        : demoFallback.status,
      message: hasAgentResult && agentData!.message
        ? agentData!.message
        : demoFallback.message,
      agentStatus: hasAgentResult ? "agent" : "demo-enriched",
      agentAddress,
    };

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[Fetch.ai] Insurance agent error:", error);
    return NextResponse.json({
      ok: true,
      data: { ...demoFallback, insurance: resolvedInsurance, agentStatus: "fallback", agentAddress },
    });
  }
}
