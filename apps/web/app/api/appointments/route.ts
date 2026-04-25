import { NextResponse } from "next/server";
import {
  listAppointmentsByPatientId,
  processCreateAppointment,
  type AppointmentRequestBody,
} from "@/lib/appointment-service";

export const runtime = "nodejs";

/**
 * `GET /api/appointments?patientId=…` — list appointments for a patient (newest first).
 */
export async function GET(req: Request) {
  const patientId = new URL(req.url).searchParams.get("patientId");
  if (!patientId?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Query parameter patientId is required" },
      { status: 400 }
    );
  }

  try {
    const { data } = await listAppointmentsByPatientId(patientId.trim());
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Failed to list appointments";
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}

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
