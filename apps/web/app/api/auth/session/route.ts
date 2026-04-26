import { NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth-service';

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ ok: false, error: "No token provided" }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 401 });
  }

  const result = await getUserById(decoded.sub);
  if (!result.ok || !result.user) {
    return NextResponse.json({ ok: false, error: result.error ?? "User not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: { user: result.user } });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ ok: false, error: "No token provided" }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 401 });
  }

  const result = await getUserById(decoded.sub);
  if (!result.ok || !result.user) {
    return NextResponse.json({ ok: false, error: result.error ?? "User not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: { user: result.user } });
}
