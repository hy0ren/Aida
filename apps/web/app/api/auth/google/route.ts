import { NextResponse } from "next/server";
import { loginWithGoogle } from "@/lib/auth-service";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";

    const result = await loginWithGoogle(accessToken);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: { token: result.token, user: result.user },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}
