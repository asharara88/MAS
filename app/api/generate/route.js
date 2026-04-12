import { MASTER_SYSTEM_PROMPT } from "../../../lib/prompts";

export const runtime = "edge";

export async function POST(req) {
  try {
    const { prompt, apiKey } = await req.json();

    if (!apiKey || !apiKey.startsWith("sk-ant-")) {
      return Response.json({ error: "Valid Anthropic API key required (starts with sk-ant-)" }, { status: 400 });
    }

    if (!prompt || prompt.length < 10) {
      return Response.json({ error: "Agent description must be at least 10 characters" }, { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: MASTER_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    // Handle non-OK responses safely
    if (!response.ok) {
      const errText = await response.text();
      try {
        const errJson = JSON.parse(errText);
        return Response.json(
          { error: errJson.error?.message || "Anthropic API error: " + response.status },
          { status: 502 }
        );
      } catch {
        return Response.json(
          { error: "Anthropic API returned status " + response.status + ": " + errText.substring(0, 300) },
          { status: 502 }
        );
      }
    }

    const data = await response.json();

    if (data.error) {
      return Response.json({ error: data.error.message || "Anthropic API error" }, { status: 502 });
    }

    const text = data.content && data.content[0] && data.content[0].text ? data.content[0].text : "";

    if (!text) {
      return Response.json({ error: "Empty response from Claude" }, { status: 422 });
    }

    try {
      const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);
      return Response.json({ agent: parsed, usage: data.usage });
    } catch (parseErr) {
      return Response.json(
        { error: "Failed to parse agent output: " + parseErr.message, raw: text.substring(0, 1000) },
        { status: 422 }
      );
    }
  } catch (err) {
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
