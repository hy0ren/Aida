export type Asi1AgentResult = {
  text: string;
  executableData?: unknown[];
  metadata?: unknown;
};

type Asi1ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string };
    delta?: { content?: string };
  }>;
  executable_data?: unknown[];
  metadata?: unknown;
};

export function getAsi1ApiKey() {
  return process.env.ASI1_API_KEY || process.env.FETCHAI_API_KEY || "";
}

export async function callAsi1Agent({
  agentAddress,
  prompt,
  sessionId,
  maxTokens = 900,
}: {
  agentAddress: string;
  prompt: string;
  sessionId: string;
  maxTokens?: number;
}): Promise<Asi1AgentResult> {
  const apiKey = getAsi1ApiKey();
  if (!apiKey) {
    throw new Error("ASI1_API_KEY or FETCHAI_API_KEY is required to call ASI:One agents.");
  }
  const response = await fetch("https://api.asi1.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "x-session-id": sessionId,
    },
    body: JSON.stringify({
      model: "asi1",
      agent_address: agentAddress,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`ASI:One agent call failed: ${response.status} ${responseText.slice(0, 500)}`);
  }
  const payload = JSON.parse(responseText) as Asi1ChatCompletionResponse;
  return {
    text: payload.choices?.[0]?.message?.content || payload.choices?.[0]?.delta?.content || responseText,
    executableData: payload.executable_data,
    metadata: payload.metadata,
  };
}

