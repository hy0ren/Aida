import { ObjectId } from "mongodb";
import {
  demoData,
  type ListSummariesData,
  type SummaryHistoryItem,
  type SummaryResponse,
} from "@aida/shared";
import { demoSummaryResponse } from "@/app/api/_mock/aida-demo";
import { AIDA_GEMINI_MODEL } from "@/lib/gemini-model";
import { collections, getDb, isMongoConfigured } from "@/lib/mongodb";

export type SummaryRequestBody = {
  uploadId?: string;
  patientId?: string;
  language?: string;
  biometrics?: unknown;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
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

  const promptData = body.biometrics
    ? JSON.stringify(body.biometrics)
    : JSON.stringify({
        metrics: demoData.biometricMetrics,
        notes: demoData.healthSummary.notesForAida,
      });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AIDA_GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptData }] }],
        systemInstruction: {
          parts: [
            {
              text: `You are Aida, an AI medical summarizer. Summarize on-device preprocessed biometric data in a non-clinical, reassuring way for the patient. Highlight flagged metrics. The summary must be natively written in ${targetLanguage}. Keep it under 3 paragraphs. Do not include markdown formatting.`,
            },
          ],
        },
        generationConfig: {
          maxOutputTokens: 1024,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API request failed: ${response.status}`);
  }

  const payload = await response.json() as GeminiGenerateContentResponse;
  const summaryText = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();
  const data: SummaryResponse = {
    ...buildDemoSummary(body),
    summary: summaryText && summaryText.length > 0
      ? summaryText
      : demoSummaryResponse.summary,
  };

  await persistSummary(data, "gemini");
  return { data, source: "gemini" };
}

export async function listSummariesByPatientId(
  patientId: string,
): Promise<{ data: ListSummariesData; source: "database" | "demo" }> {
  if (!isMongoConfigured()) {
    return {
      data: {
        items: [
          {
            ...demoSummaryResponse,
            createdAt: demoData.selectedAppointment.scheduledAt,
            source: "demo",
            approvedByPatient: true,
          },
        ],
      },
      source: "demo",
    };
  }

  const db = await getDb();
  if (!db) {
    return { data: { items: [] }, source: "demo" };
  }

  const docs = await db
    .collection(collections.biometricSummaries)
    .find({ patientId }, { sort: { createdAt: -1 } })
    .project({
      _id: 0,
      summaryId: 1,
      patientId: 1,
      uploadId: 1,
      specialtyRecommendation: 1,
      urgency: 1,
      summary: 1,
      shareItems: 1,
      biometricHighlights: 1,
      source: 1,
      approvedByPatient: 1,
      createdAt: 1,
    })
    .toArray();

  const items: SummaryHistoryItem[] = docs.map((doc) => {
    const created = doc.createdAt;
    const createdAt =
      created instanceof Date
        ? created.toISOString()
        : created != null
          ? new Date(created as string | number).toISOString()
          : new Date(0).toISOString();

    return {
      summaryId: String(doc.summaryId),
      patientId: String(doc.patientId),
      uploadId: String(doc.uploadId),
      specialtyRecommendation: String(doc.specialtyRecommendation),
      urgency: doc.urgency as SummaryHistoryItem["urgency"],
      summary: String(doc.summary),
      shareItems: Array.isArray(doc.shareItems) ? doc.shareItems as string[] : [],
      biometricHighlights: Array.isArray(doc.biometricHighlights)
        ? doc.biometricHighlights as SummaryHistoryItem["biometricHighlights"]
        : [],
      source: doc.source === "gemini" ? "gemini" : "demo",
      approvedByPatient: Boolean(doc.approvedByPatient),
      createdAt,
    };
  });

  return { data: { items }, source: "database" };
}
