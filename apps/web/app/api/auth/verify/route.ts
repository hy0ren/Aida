import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { proof, action } = body;
    const appId = process.env.WORLD_ID_APP_ID;

    if (!appId) {
      console.warn("WORLD_ID_APP_ID missing, falling back to mock authentication");
      return NextResponse.json({ ok: true, route: 'auth/verify' });
    }

    const res = await fetch(`https://developer.worldcoin.org/api/v1/verify/${appId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...proof,
        action,
      }),
    });

    if (res.ok) {
      return NextResponse.json({ ok: true, route: 'auth/verify' });
    } else {
      const { code, detail } = await res.json();
      return NextResponse.json({ ok: false, error: `${code}: ${detail}` }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
