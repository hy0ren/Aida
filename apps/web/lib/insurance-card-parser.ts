import type { InsuranceCardExtraction, InsuranceProfile, UploadedFile } from "@aida/shared";
import { AIDA_GEMINI_MODEL } from "@/lib/gemini-model";

type InsuranceCardImage = {
  name: string;
  type: UploadedFile["type"];
  data: string;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type GeminiInsuranceJson = {
  carrier?: string;
  plan?: string;
  memberId?: string;
  groupNumber?: string;
  payerPhone?: string;
  subscriberName?: string;
  dependentName?: string;
  rxBin?: string;
  rxPcn?: string;
  rxGroup?: string;
  copayPrimaryCare?: number;
  copaySpecialist?: number;
  confidence?: number;
  needsReview?: boolean;
  reviewReason?: string;
};

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const INSURANCE_CARD_SCHEMA = {
  type: "object",
  properties: {
    carrier: {
      type: "string",
      description: "Insurance company or payer name visible on the card. Empty string if not visible.",
    },
    plan: {
      type: "string",
      description: "Plan name, plan type, product, or network visible on the card. Empty string if not visible.",
    },
    memberId: {
      type: "string",
      description: "Member ID, subscriber ID, policy ID, or ID number. Empty string if not visible.",
    },
    groupNumber: {
      type: "string",
      description: "Group number or group ID. Empty string if not visible.",
    },
    payerPhone: {
      type: "string",
      description: "Customer service, provider services, or benefits phone number on the card. Empty string if not visible.",
    },
    subscriberName: {
      type: "string",
      description: "Subscriber or member name visible on the card. Empty string if not visible.",
    },
    dependentName: {
      type: "string",
      description: "Dependent or patient name if distinct from subscriber. Empty string if not visible.",
    },
    rxBin: {
      type: "string",
      description: "Prescription BIN / RxBIN. Empty string if not visible.",
    },
    rxPcn: {
      type: "string",
      description: "Prescription PCN / RxPCN. Empty string if not visible.",
    },
    rxGroup: {
      type: "string",
      description: "Prescription group / RxGroup. Empty string if not visible.",
    },
    copayPrimaryCare: {
      type: "number",
      description: "Primary care copay amount in USD if visible. Use 0 if not visible.",
    },
    copaySpecialist: {
      type: "number",
      description: "Specialist copay amount in USD if visible. Use 0 if not visible.",
    },
    confidence: {
      type: "integer",
      description: "Overall extraction confidence from 0 to 100.",
    },
    needsReview: {
      type: "boolean",
      description: "True if any key insurance fields are missing, blurry, contradictory, or uncertain.",
    },
    reviewReason: {
      type: "string",
      description: "Short reason the patient should review the extracted data. Empty string if no review is needed.",
    },
  },
  required: [
    "carrier",
    "plan",
    "memberId",
    "groupNumber",
    "payerPhone",
    "subscriberName",
    "dependentName",
    "rxBin",
    "rxPcn",
    "rxGroup",
    "copayPrimaryCare",
    "copaySpecialist",
    "confidence",
    "needsReview",
    "reviewReason",
  ],
} as const;

function toInlineImagePart(data: string): { inline_data: { mime_type: string; data: string } } | null {
  const trimmed = data.trim();
  const dataUrlMatch = /^data:([^;,]+);base64,([\s\S]+)$/i.exec(trimmed);
  const mimeType = dataUrlMatch
    ? dataUrlMatch[1].toLowerCase() === "image/jpg"
      ? "image/jpeg"
      : dataUrlMatch[1].toLowerCase()
    : "image/jpeg";
  const base64 = dataUrlMatch ? dataUrlMatch[2] : trimmed;

  if (!SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) return null;

  return {
    inline_data: {
      mime_type: mimeType,
      data: base64.replace(/\s/g, ""),
    },
  };
}

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function cleanNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, "").trim());
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function cleanConfidence(value: unknown): number {
  const raw = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function parseJsonText(text: string): GeminiInsuranceJson {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned) as GeminiInsuranceJson;
}

export function mergeInsuranceProfile(
  fallback: InsuranceProfile,
  extraction?: InsuranceCardExtraction,
): InsuranceProfile {
  return {
    carrier: extraction?.carrier ?? fallback.carrier,
    plan: extraction?.plan ?? fallback.plan,
    memberId: extraction?.memberId ?? fallback.memberId,
    groupNumber: extraction?.groupNumber ?? fallback.groupNumber,
    payerPhone: extraction?.payerPhone ?? fallback.payerPhone,
    network: extraction?.source === "gemini" ? "needs-review" : fallback.network,
    estimatedCopay:
      extraction?.copaySpecialist ??
      extraction?.copayPrimaryCare ??
      fallback.estimatedCopay,
  };
}

export async function parseInsuranceCardImagesWithGemini(
  files: InsuranceCardImage[],
): Promise<InsuranceCardExtraction | undefined> {
  const imageParts = files
    .map((file) => toInlineImagePart(file.data))
    .filter((part): part is { inline_data: { mime_type: string; data: string } } => Boolean(part));

  if (imageParts.length === 0) return undefined;

  if (!process.env.GEMINI_API_KEY) {
    return {
      source: "not-run",
      confidence: 0,
      needsReview: true,
      reviewReason: "GEMINI_API_KEY is not configured, so the insurance card was not parsed.",
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AIDA_GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              ...imageParts,
              {
                text: [
                  "Extract insurance-card information from these card photos for a patient intake form.",
                  "Use only text visible in the images. Do not infer or invent missing values.",
                  "If a value is not visible, return an empty string or 0 as requested by the schema.",
                  "This is data extraction only, not eligibility verification or medical advice.",
                ].join(" "),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: INSURANCE_CARD_SCHEMA,
          temperature: 0,
          maxOutputTokens: 1024,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini insurance-card parse failed: ${response.status}`);
  }

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini insurance-card parse returned an empty response");
  }

  const parsed = parseJsonText(text);
  const extraction: InsuranceCardExtraction = {
    source: "gemini",
    carrier: cleanString(parsed.carrier),
    plan: cleanString(parsed.plan),
    memberId: cleanString(parsed.memberId),
    groupNumber: cleanString(parsed.groupNumber),
    payerPhone: cleanString(parsed.payerPhone),
    subscriberName: cleanString(parsed.subscriberName),
    dependentName: cleanString(parsed.dependentName),
    rxBin: cleanString(parsed.rxBin),
    rxPcn: cleanString(parsed.rxPcn),
    rxGroup: cleanString(parsed.rxGroup),
    copayPrimaryCare: cleanNumber(parsed.copayPrimaryCare),
    copaySpecialist: cleanNumber(parsed.copaySpecialist),
    confidence: cleanConfidence(parsed.confidence),
    needsReview: Boolean(parsed.needsReview),
    reviewReason: cleanString(parsed.reviewReason),
  };

  if (!extraction.carrier || !extraction.memberId) {
    extraction.needsReview = true;
    extraction.reviewReason ??= "Carrier or member ID was not confidently extracted from the card.";
  }

  return extraction;
}
