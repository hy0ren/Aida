import { GoogleGenAI } from "@google/genai";
import { ObjectId } from "mongodb";
import { demoData, type SummaryResponse } from "@aida/shared";
import { demoSummaryResponse } from "@/app/api/_mock/aida-demo";
import { AIDA_GEMINI_MODEL } from "@/lib/gemini-model";
import { collections, getDb, isMongoConfigured } from "@/lib/mongodb";

export type SummaryRequestBody = {
  uploadId?: string;
  patientId?: string;
  language?: string;
  biometrics?: unknown;
};

async function persistSummary(data: SummaryResponse, source: "gemini" | "demo") {
  if (!isMongoConfigured()) return;
  const db = await getDb();
  if (!db) return;

  await db.collection(collections.biometricSummaries).insertOne({
    _id: new ObjectId(),
    ...data,
    source,
    approvedByPatient: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildDemoSummary(body: SummaryRequestBody): SummaryResponse {
  return {
    ...demoSummaryResponse,
    summaryId: `sum-${new ObjectId().toString()}`,
    patientId: body.patientId ?? demoSummaryResponse.patientId,
    uploadId: body.uploadId ?? demoSummaryResponse.uploadId,
  };
}

export async function generateBiometricSummary(
  body: SummaryRequestBody,
): Promise<{ data: SummaryResponse; source: "gemini" | "demo" }> {
  const targetLanguage = body.language || demoData.patient.preferredLanguage.label;

  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY missing, falling back to mock summary");
    const data = buildDemoSummary(body);
    await persistSummary(data, "demo");
    return { data, source: "demo" };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const promptData = body.biometrics
    ? JSON.stringify(body.biometrics)
    : JSON.stringify({
        metrics: demoData.biometricMetrics,
        notes: demoData.healthSummary.notesForAida,
      });

  const response = await ai.models.generateContent({
    model: AIDA_GEMINI_MODEL,
    contents: promptData,
    config: {
      systemInstruction: `You are Aida, an AI medical summarizer. Summarize on-device preprocessed biometric data in a non-clinical, reassuring way for the patient. Highlight flagged metrics. The summary must be natively written in ${targetLanguage}. Keep it under 3 paragraphs. Do not include markdown formatting.`,
      maxOutputTokens: 1024,
    },
  });

  const summaryText = response.text?.trim();
  const data: SummaryResponse = {
    ...buildDemoSummary(body),
    summary: summaryText && summaryText.length > 0
      ? summaryText
      : demoSummaryResponse.summary,
  };

  await persistSummary(data, "gemini");
  return { data, source: "gemini" };
}
