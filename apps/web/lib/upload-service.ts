import { ObjectId } from "mongodb";
import {
  demoData,
  type InsuranceCardExtraction,
  type ListUploadsData,
  type UploadListItem,
  type UploadResponse,
  type UploadedFile,
} from "@aida/shared";
import {
  demoBiometrics,
  demoInsurance,
  demoUploadResponse,
} from "@/app/api/_mock/aida-demo";
import { isCloudinaryConfigured, uploadBase64ToCloudinary } from "@/lib/cloudinary-server";
import {
  mergeInsuranceProfile,
  parseInsuranceCardImagesWithGemini,
} from "@/lib/insurance-card-parser";
import { collections, getDb, isMongoConfigured } from "@/lib/mongodb";

export type UploadRequestBody = {
  patientId?: string;
  insuranceComplete?: boolean;
  healthComplete?: boolean;
  healthSource?: string;
  notes?: string;
  files?: Array<{
    name: string;
    type: UploadedFile["type"];
    /** Data URL or raw base64 */
    data: string;
  }>;
};

/**
 * 1) Optional insurance-card images → Gemini 2.5 Flash extraction.
 * 2) Optional file payloads → Cloudinary (`aida/uploads/{uploadId}/…`) when configured.
 * 3) Document → Mongo `uploads` (when `MONGODB_URI` is set).
 */
export async function processUploadIntake(body: UploadRequestBody): Promise<{
  data: UploadResponse;
  source: "database" | "demo";
}> {
  const uploadId = `upload-${new ObjectId().toString()}`;
  const patientId = body.patientId ?? demoData.patient.id;
  const notes = typeof body.notes === "string" ? body.notes : demoUploadResponse.notes;
  /** Insurance is the gate for the summary flow; health (sync, manual, or files) is optional. */
  const readyForSummary = Boolean(body.insuranceComplete ?? true);

  const submittedFiles = body.files ?? [];
  const insuranceCardFiles = submittedFiles.filter(
    (file) => file.type === "insurance-front" || file.type === "insurance-back"
  );
  let insuranceExtraction: InsuranceCardExtraction | undefined;
  try {
    insuranceExtraction = await parseInsuranceCardImagesWithGemini(insuranceCardFiles);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Gemini insurance-card parse error";
    console.error("[Gemini] Insurance-card parsing failed:", message);
    insuranceExtraction = {
      source: "not-run",
      confidence: 0,
      needsReview: true,
      reviewReason: message,
    };
  }
  if (insuranceExtraction?.source === "not-run") {
    console.warn("[Gemini] Insurance-card parsing skipped:", insuranceExtraction.reviewReason);
  }

  let files: UploadedFile[] = demoUploadResponse.files.map((f) => ({ ...f }));

  if (submittedFiles.length && isCloudinaryConfigured()) {
    const folder = `aida/uploads/${uploadId}`;
    const uploaded: UploadedFile[] = [];
    for (let i = 0; i < submittedFiles.length; i += 1) {
      const file = submittedFiles[i];
      const { secureUrl, publicId } = await uploadBase64ToCloudinary(file.data, {
        folder,
        publicId: `${file.type.replace(/[^a-z-]/g, "")}-${i}`,
      });
      uploaded.push({
        id: `file-${new ObjectId().toString()}`,
        name: file.name,
        type: file.type,
        source: "cloudinary",
        status:
          (file.type === "insurance-front" || file.type === "insurance-back") &&
          insuranceExtraction?.needsReview
            ? "needs-review"
            : "processed",
        url: secureUrl,
        publicId,
      });
    }
    files = uploaded;
  } else if (submittedFiles.length) {
    files = submittedFiles.map((file) => ({
      id: `file-${new ObjectId().toString()}`,
      name: file.name,
      type: file.type,
      source: "mobile-upload",
      status:
        (file.type === "insurance-front" || file.type === "insurance-back") &&
        insuranceExtraction?.needsReview
          ? "needs-review"
          : "processed",
    }));
  }

  const insurance = mergeInsuranceProfile(demoInsurance, insuranceExtraction);

  const data: UploadResponse = {
    ...demoUploadResponse,
    uploadId,
    patientId,
    insurance,
    insuranceExtraction,
    biometrics: demoBiometrics,
    files,
    notes,
    readyForSummary,
  };

  if (isMongoConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection(collections.uploads).insertOne({
        _id: new ObjectId(),
        uploadId: data.uploadId,
        patientId: data.patientId,
        createdAt: new Date(),
        insuranceComplete: body.insuranceComplete ?? true,
        healthComplete: body.healthComplete ?? true,
        healthSource: body.healthSource,
        notes: data.notes,
        insurance: data.insurance,
        insuranceExtraction: data.insuranceExtraction,
        files: data.files,
        readyForSummary: data.readyForSummary,
      });
      return { data, source: "database" };
    }
  }

  return { data, source: "demo" };
}

export async function listUploadsByPatientId(
  patientId: string
): Promise<{ data: ListUploadsData; source: "database" | "demo" }> {
  if (!isMongoConfigured()) {
    return { data: { items: [] }, source: "demo" };
  }
  const db = await getDb();
  if (!db) {
    return { data: { items: [] }, source: "demo" };
  }

  const docs = await db
    .collection(collections.uploads)
    .find({ patientId }, { sort: { createdAt: -1 } })
    .project({
      _id: 0,
      uploadId: 1,
      patientId: 1,
      createdAt: 1,
      readyForSummary: 1,
      notes: 1,
      files: 1,
    })
    .toArray();

  const items: UploadListItem[] = docs.map((d) => {
    const created = d.createdAt;
    const createdAt =
      created instanceof Date
        ? created.toISOString()
        : created != null
          ? new Date(created as string | number).toISOString()
          : new Date(0).toISOString();
    return {
      uploadId: d.uploadId as string,
      patientId: d.patientId as string,
      createdAt,
      readyForSummary: Boolean(d.readyForSummary),
      fileCount: Array.isArray(d.files) ? d.files.length : 0,
      notes: typeof d.notes === "string" ? d.notes : "",
    };
  });

  return { data: { items }, source: "database" };
}
