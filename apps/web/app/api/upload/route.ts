import { NextResponse } from "next/server";
import {
  listUploadsByPatientId,
  processUploadIntake,
  type UploadRequestBody,
} from "@/lib/upload-service";

export const runtime = "nodejs";

/**
 * `GET /api/upload?patientId=…` — list upload intake rows for a patient (newest first).
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
    const { data } = await listUploadsByPatientId(patientId.trim());
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Failed to list uploads";
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: UploadRequestBody = {};
  try {
    body = (await req.json()) as UploadRequestBody;
  } catch {
    body = {};
  }

  try {
    const { data } = await processUploadIntake(body);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
