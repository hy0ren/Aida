import { NextResponse } from "next/server";
import { processCreateAppointment, type AppointmentRequestBody } from "@/lib/appointment-service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: AppointmentRequestBody = {};
  try {
    body = (await req.json()) as AppointmentRequestBody;
  } catch {
    body = {};
  }

  try {
    const { data } = await processCreateAppointment(body);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Failed to create appointment";
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
