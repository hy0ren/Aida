import { NextResponse } from "next/server";
import {
  sendAppointmentConfirmation,
  type ConfirmationRequestBody,
} from "@/lib/confirmation-service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: ConfirmationRequestBody = {};
  try {
    body = (await req.json()) as ConfirmationRequestBody;
  } catch {
    body = {};
  }

  try {
    const { data } = await sendAppointmentConfirmation(body);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Failed to send confirmation.";
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
