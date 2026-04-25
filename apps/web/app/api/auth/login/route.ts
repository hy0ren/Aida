import { NextResponse } from "next/server";
import { login } from "@/lib/auth-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const result = await login(email, password);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { token: result.token, user: result.user },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
