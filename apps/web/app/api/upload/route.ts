import { NextResponse } from "next/server";
import { processUploadIntake, type UploadRequestBody } from "@/lib/upload-service";

export const runtime = "nodejs";

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
