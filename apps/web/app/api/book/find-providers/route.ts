import { NextResponse } from 'next/server';
import { findProvidersResponse } from '../../_mock/aida-demo';
import type { FindProvidersResponse, ProviderOption } from '@aida/shared';

const AGENTVERSE_BASE = "https://agentverse.ai/v1beta1/almanac/agents";

type FindProvidersBody = {
  summaryId?: string;
  patientId?: string;
  language?: string;
  location?: string;
  specialty?: string;
};

type AgentResponse = {
  providers?: Array<{
    name?: string;
    doctor?: string;
    specialty?: string;
    address?: string;
    phone?: string;
    distance?: string;
    next_available?: string;
    network_status?: string;
    languages?: string[];
  }>;
  recommended_visit?: string;
  [key: string]: unknown;
};

function mapAgentProviders(agentProviders: AgentResponse["providers"], language: string): ProviderOption[] {
  if (!Array.isArray(agentProviders) || agentProviders.length === 0) return [];
  return agentProviders.map((p, i) => ({
    id: `agent-provider-${i}`,
    name: p.name ?? `Provider ${i + 1}`,
    doctor: p.doctor ?? "Dr. Unknown",
    specialty: p.specialty ?? "General",
    distance: p.distance ?? "N/A",
    address: p.address ?? "",
    phone: p.phone ?? "",
    nextAvailable: p.next_available ?? new Date(Date.now() + 86400000).toISOString(),
    networkStatus: p.network_status === "out-of-network" ? "review-plan" as const : "in-network" as const,
    languages: p.languages ?? ["English", language],
  }));
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as FindProvidersBody;
  const agentAddress = process.env.FETCHAI_SCHEDULER_AGENT_ADDRESS;
  const apiKey = process.env.FETCHAI_API_KEY;
  const demoFallback = findProvidersResponse(body.summaryId);

  if (!agentAddress || !apiKey) {
    console.warn("[Fetch.ai] Scheduler agent credentials missing — returning demo providers.");
    return NextResponse.json({ ok: true, data: demoFallback });
  }

  try {
    const chatPayload = {
      payload: {
        type: "chat",
        user_intent: "find_providers",
        location: body.location ?? "Los Angeles, CA",
        specialty: body.specialty ?? "cardiology",
        language: body.language ?? "English",
        patient_id: body.patientId,
        summary_id: body.summaryId,
      },
    };

    console.log("[Fetch.ai] Sending find-providers request to scheduler agent:", agentAddress);

    const response = await fetch(`${AGENTVERSE_BASE}/${agentAddress}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatPayload),
    });

    const responseText = await response.text();
    console.log("[Fetch.ai] Scheduler agent status:", response.status, "body:", responseText.slice(0, 500));

    if (!response.ok) {
      console.warn("[Fetch.ai] Scheduler agent returned", response.status, "— using demo providers.");
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

    const agentProviders = agentData ? mapAgentProviders(agentData.providers, body.language ?? "English") : [];

    const data: FindProvidersResponse & { agentStatus: string; agentAddress: string } = {
      patientId: body.patientId ?? demoFallback.patientId,
      summaryId: body.summaryId ?? demoFallback.summaryId,
      recommendedVisit: agentData?.recommended_visit
        ? String(agentData.recommended_visit)
        : demoFallback.recommendedVisit,
      providers: agentProviders.length > 0 ? agentProviders : demoFallback.providers,
      agentStatus: agentProviders.length > 0 ? "agent" : "demo-enriched",
      agentAddress,
    };

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[Fetch.ai] Scheduler agent error:", error);
    return NextResponse.json({
      ok: true,
      data: { ...demoFallback, agentStatus: "fallback", agentAddress },
    });
  }
}
