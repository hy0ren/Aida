import { ObjectId } from "mongodb";
import { demoData, type UploadResponse, type UploadedFile } from "@aida/shared";
import {
  demoBiometrics,
  demoInsurance,
  demoUploadResponse,
} from "@/app/api/_mock/aida-demo";
import { isCloudinaryConfigured, uploadBase64ToCloudinary } from "@/lib/cloudinary-server";
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
 * 1) Optional file payloads → Cloudinary (`aida/uploads/{uploadId}/…`).
 * 2) Document → Mongo `uploads` (when `MONGODB_URI` is set).
 * 3) Response always matches `UploadResponse` (insurance / biometrics stay demo until OCR is wired).
 */
export async function processUploadIntake(body: UploadRequestBody): Promise<{
  data: UploadResponse;
  source: "database" | "demo";
}> {
  const uploadId = `upload-${new ObjectId().toString()}`;
  const patientId = body.patientId ?? demoData.patient.id;
  const notes = typeof body.notes === "string" ? body.notes : demoUploadResponse.notes;
  const readyForSummary = Boolean(
    (body.insuranceComplete ?? true) && (body.healthComplete ?? true)
  );

  let files: UploadedFile[] = demoUploadResponse.files.map((f) => ({ ...f }));

  if (body.files?.length && isCloudinaryConfigured()) {
    const folder = `aida/uploads/${uploadId}`;
    const uploaded: UploadedFile[] = [];
    for (let i = 0; i < body.files.length; i += 1) {
      const file = body.files[i];
      const { secureUrl, publicId } = await uploadBase64ToCloudinary(file.data, {
        folder,
        publicId: `${file.type.replace(/[^a-z-]/g, "")}-${i}`,
      });
      uploaded.push({
        id: `file-${new ObjectId().toString()}`,
        name: file.name,
        type: file.type,
        source: "cloudinary",
        status: "processed",
        url: secureUrl,
        publicId,
      });
    }
    files = uploaded;
  }

  const data: UploadResponse = {
    ...demoUploadResponse,
    uploadId,
    patientId,
    insurance: demoInsurance,
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
        files: data.files,
        readyForSummary: data.readyForSummary,
      });
      return { data, source: "database" };
    }
  }

  return { data, source: "demo" };
}
