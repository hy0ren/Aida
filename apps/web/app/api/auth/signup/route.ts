import { NextResponse } from "next/server";
import { signup } from "@/lib/auth-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    const result = await signup(email, password, name);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { token: result.token, user: result.user },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
