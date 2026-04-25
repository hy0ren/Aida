import { NextResponse } from 'next/server';
import { verifyInsuranceResponse } from '../../_mock/aida-demo';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Agentverse / Fetch.ai integration
    const agentAddress = process.env.FETCHAI_INSURANCE_AGENT_ADDRESS;
    const apiKey = process.env.FETCHAI_API_KEY;

    if (!agentAddress || !apiKey) {
      console.warn("Fetch.ai Agentverse credentials missing. Falling back to mock response.");
      return NextResponse.json({
        ok: true,
        data: verifyInsuranceResponse(body.providerId),
      });
    }

    // Implementing the mandatory Chat Protocol against the Agentverse Mailbox API
    const response = await fetch(`https://agentverse.ai/v1beta1/almanac/agents/${agentAddress}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        payload: {
          user_intent: "verify insurance",
          insurance_details: body.insurance || {}
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Agentverse request failed: ${response.status}`);
    }

    // In a real system, you would poll or listen to a webhook for the asynchronous response. 
    // Here we gracefully mix real initiation with mock completion for demo purposes.
    return NextResponse.json({
      ok: true,
      data: verifyInsuranceResponse(body.providerId),
    });

  } catch (error) {
    console.error("Fetch.ai Insurance API Error:", error);
    return NextResponse.json({ ok: false, error: "Insurance verification failed." }, { status: 500 });
  }
}
