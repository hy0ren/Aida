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

  try {
    const started = Date.now();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: 'Reply with exactly the phrase: "Aida key works". No other text.' },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 32,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned ${response.status}: ${await response.text()}`);
    }

    const payload = await response.json();
    const elapsedMs = Date.now() - started;

    const candidate = payload.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
      .map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim();
    const usage = payload.usageMetadata;

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
