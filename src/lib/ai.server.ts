export class AiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

/** One chat completion through DeepSeek; returns final text. Times out after 20s. */
export async function askAi(system: string, prompt: string, opts: { json?: boolean } = {}): Promise<{ text: string }> {
  const apiKey = process.env["DEEPSEEK_API_KEY"];
  if (!apiKey) throw new AiError("AI is not configured.", 401);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let status: number | undefined;
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    status = res.status;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`DeepSeek ${res.status}: ${body.slice(0, 500)}`);
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("DeepSeek returned an empty reply");
    return { text };
  } catch (e) {
    console.error("AI call failed", status, e);
    throw new AiError(status === 429 ? "AI is busy right now. Try again in a minute." : "AI couldn't read this message. Try again.", status);
  } finally {
    clearTimeout(timer);
  }
}

export function parseJson<T>(text: string): T | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}
