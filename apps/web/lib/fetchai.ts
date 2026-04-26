export function parseAgentJsonResponse<T extends Record<string, unknown>>(
  responseText: string,
): T | null {
  const trimmed = responseText.trim();
  if (!trimmed) return null;

  const candidates = [trimmed, ...(trimmed.match(/\{[\s\S]*\}/g) ?? [])];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === "object") return parsed as T;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

export function buildAgentPrompt(intent: string, payload: Record<string, unknown>) {
  return `${intent} ${JSON.stringify(payload)}`;
}

