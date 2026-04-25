import { GoogleGenAI } from "@google/genai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error(
      "[FAIL] GEMINI_API_KEY is not set. " +
        "Run via: npm run test:gemini (which loads apps/web/.env.local)."
    );
    process.exit(1);
  }

  // Keep in sync with apps/web/lib/gemini-model.ts
  const model = "gemini-2.5-flash";
  console.log(`[INFO] Calling Gemini (${model}) with a tiny sanity prompt...`);

  const ai = new GoogleGenAI({ apiKey });

  try {
    const started = Date.now();
    const response = await ai.models.generateContent({
      model,
      contents:
        'Reply with exactly the phrase: "Aida key works". No other text.',
      config: {
        maxOutputTokens: 32,
      },
    });
    const elapsedMs = Date.now() - started;

    const text = (response.text ?? "").trim();
    const usage = response.usageMetadata;
    const candidate = response.candidates?.[0];

    console.log("[PASS] Gemini API responded.");
    console.log(`  model:         ${model}`);
    console.log(`  finish_reason: ${candidate?.finishReason ?? "unknown"}`);
    if (usage) {
      console.log(
        `  usage:         prompt=${usage.promptTokenCount ?? 0} ` +
          `candidates=${usage.candidatesTokenCount ?? 0} ` +
          `total=${usage.totalTokenCount ?? 0}`
      );
    }
    console.log(`  elapsed:       ${elapsedMs}ms`);
    console.log(`  text:          ${JSON.stringify(text)}`);

    if (!/aida/i.test(text)) {
      console.warn(
        '[WARN] Response text did not include "Aida"; API call still succeeded.'
      );
    }

    process.exit(0);
  } catch (err) {
    console.error("[FAIL] Gemini API call failed.");
    if (err && typeof err === "object") {
      const status = "status" in err ? err.status : undefined;
      const name = "name" in err ? err.name : undefined;
      const message = "message" in err ? err.message : undefined;
      console.error(`  name:    ${name}`);
      console.error(`  status:  ${status}`);
      console.error(`  message: ${message}`);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
