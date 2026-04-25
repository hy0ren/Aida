import { NextResponse } from 'next/server';
import { callSessionResponse } from '../../_mock/aida-demo';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;

    if (!apiKey || !agentId) {
      console.warn("ElevenLabs credentials missing. Falling back to mock call session.");
      return NextResponse.json({
        ok: true,
        data: callSessionResponse(body.providerId),
      });
    }

    // Example fetch to ElevenLabs conversational AI to start an outbound call to the clinic
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}/calls`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient_phone_number: body.clinicPhone || "+1234567890",
        dynamic_variables: {
          patient_name: body.patientName || "Jane Doe",
          provider_name: body.providerName || "Dr. Smith",
          specialty: body.specialty || "General",
        }
      })
    });

    if (!response.ok) {
      throw new Error("Failed to initiate ElevenLabs call: " + await response.text());
    }

    const elevenLabsData = await response.json();
    
    // Mix the mock response with real call ID
    return NextResponse.json({
      ok: true,
      data: {
        ...callSessionResponse(body.providerId),
        callSessionId: elevenLabsData.call_id || "call-" + Math.random().toString(36).substring(7),
        status: 'calling'
      },
    });

  } catch (error) {
    console.error("ElevenLabs Error:", error);
    return NextResponse.json({
      ok: true,
      data: callSessionResponse(),
      warning: "Live call initiation failed; returned demo call session.",
    });
  }
}
