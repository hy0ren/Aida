import { NextResponse } from "next/server";
import { getUserById, updateUserProfile, verifyToken } from "@/lib/auth-service";

function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

function authenticate(req: Request): { userId: string } | { error: NextResponse } {
  const token = getBearerToken(req);
  if (!token) {
    return {
      error: NextResponse.json({ ok: false, error: "Missing auth token." }, { status: 401 }),
    };
  }

  const payload = verifyToken(token);
  if (!payload?.sub) {
    return {
      error: NextResponse.json({ ok: false, error: "Invalid auth token." }, { status: 401 }),
    };
  }

  return { userId: payload.sub };
}

export async function GET(req: Request) {
  try {
    const auth = authenticate(req);
    if ("error" in auth) return auth.error;

    const result = await getUserById(auth.userId);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: { user: result.user } });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = authenticate(req);
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const result = await updateUserProfile(auth.userId, body);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data: { user: result.user } });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
