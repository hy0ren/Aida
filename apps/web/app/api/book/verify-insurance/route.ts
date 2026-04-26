import { NextResponse } from 'next/server';
import { verifyInsuranceResponse, demoInsurance } from '../../_mock/aida-demo';
import type { InsuranceVerificationResponse, InsuranceProfile } from '@aida/shared';

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

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as VerifyInsuranceBody;
  const agentAddress = process.env.FETCHAI_INSURANCE_AGENT_ADDRESS;
  const apiKey = process.env.FETCHAI_API_KEY;
  const demoFallback = verifyInsuranceResponse(body.providerId);

  if (!agentAddress || !apiKey) {
    console.warn("[Fetch.ai] Insurance agent credentials missing — returning demo verification.");
    return NextResponse.json({ ok: true, data: demoFallback });
  }

  try {
    const chatPayload = {
      payload: {
        type: "chat",
        user_intent: "verify_insurance",
        provider_id: body.providerId,
        patient_id: body.patientId,
        insurance_details: {
          carrier: body.insurance?.carrier ?? demoInsurance.carrier,
          plan: body.insurance?.plan ?? demoInsurance.plan,
          member_id: body.insurance?.memberId ?? demoInsurance.memberId,
          group_number: body.insurance?.groupNumber ?? demoInsurance.groupNumber,
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
        data: { ...demoFallback, agentStatus: "error", agentAddress },
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
            carrier: agentData!.carrier ?? demoInsurance.carrier,
            plan: agentData!.plan ?? demoInsurance.plan,
            memberId: agentData!.member_id ?? demoInsurance.memberId,
            groupNumber: agentData!.group_number ?? demoInsurance.groupNumber,
            payerPhone: demoInsurance.payerPhone,
            network: agentData!.network_status ?? demoInsurance.network,
            estimatedCopay: agentData!.estimated_copay ?? demoInsurance.estimatedCopay,
          }
        : demoFallback.insurance,
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
      data: { ...demoFallback, agentStatus: "fallback", agentAddress },
    });
  }
}
