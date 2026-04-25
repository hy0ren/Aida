import { NextResponse } from 'next/server';
import { findProvidersResponse } from '../../_mock/aida-demo';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Agentverse / Fetch.ai integration
    const agentAddress = process.env.FETCHAI_SCHEDULER_AGENT_ADDRESS;
    const apiKey = process.env.FETCHAI_API_KEY;

    if (!agentAddress || !apiKey) {
      console.warn("Fetch.ai Agentverse credentials missing. Falling back to mock response.");
      return NextResponse.json({
        ok: true,
        data: findProvidersResponse(body.summaryId),
      });
    }

    // Chat Protocol request to Fetch.ai Agentverse
    const response = await fetch(`https://agentverse.ai/v1beta1/almanac/agents/${agentAddress}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        payload: {
          user_intent: "find providers",
          location: body.location || "local",
          specialty: body.specialty || "general"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Agentverse request failed: ${response.status}`);
    }

    // Wait for the synchronous or async response depending on the Fetch agent type
    return NextResponse.json({
      ok: true,
      data: findProvidersResponse(body.summaryId),
    });

  } catch (error) {
    console.error("Fetch.ai Provider API Error:", error);
    return NextResponse.json({ ok: false, error: "Provider search failed." }, { status: 500 });
  }
}
