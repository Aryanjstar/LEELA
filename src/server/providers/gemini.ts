import { redact } from "../../config/env";
import { ProviderError, classifyStatus } from "./errors";

const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.5-flash", "gemini-flash-lite-latest"];

export type GeminiResult = { json: unknown; model: string };

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    logline: { type: "string" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          purpose: { type: "string", enum: ["hook", "setup", "explain", "example", "recap", "cta"] },
          narration: { type: "string" },
          kicker: { type: "string" },
          title: { type: "string" },
          slam: { type: "string" },
          handwritten: { type: "string" },
          visual: {
            type: "string",
            enum: ["none", "lattu-still", "lattu-spin", "orbit-pull", "orbit-side", "orbit-both", "compare", "bullets"],
          },
          left: { type: "string" },
          right: { type: "string" },
          leftLabel: { type: "string" },
          rightLabel: { type: "string" },
          bullets: { type: "string" },
        },
        required: [
          "purpose",
          "narration",
          "kicker",
          "title",
          "slam",
          "handwritten",
          "visual",
          "left",
          "right",
          "leftLabel",
          "rightLabel",
          "bullets",
        ],
      },
    },
  },
  required: ["title", "logline", "scenes"],
};

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? text).trim();
  return JSON.parse(raw);
}

async function callModel(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  schema: boolean;
}): Promise<{ ok: true; json: unknown } | { ok: false; status: number; detail: string }> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": opts.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: opts.user }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
        ...(opts.schema ? { responseSchema: RESPONSE_SCHEMA } : {}),
      },
    }),
  });
  const body = await response.text();
  if (!response.ok) return { ok: false, status: response.status, detail: redact(body, [opts.apiKey]) };
  const parsed = JSON.parse(body) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  if (!text) return { ok: false, status: 422, detail: "empty plan" };
  return { ok: true, json: extractJson(text) };
}

export async function geminiJson(opts: {
  apiKey: string;
  system: string;
  user: string;
  loose?: boolean;
}): Promise<GeminiResult> {
  let lastError = "No model attempted";
  for (let round = 0; round < 3; round++) {
    for (const model of MODELS) {
      try {
        let result = await callModel({ ...opts, model, schema: opts.loose ? false : true });
        if (!result.ok && result.status === 400 && !opts.loose) result = await callModel({ ...opts, model, schema: false });
        if (result.ok) return { json: result.json, model };
        lastError = `${model} ${result.status} ${result.detail}`;
        if (result.status !== 503 && result.status !== 429 && result.status !== 404) {
          throw new ProviderError(classifyStatus(result.status), lastError);
        }
      } catch (error) {
        if (error instanceof ProviderError) throw error;
        lastError = error instanceof Error ? error.message : "network";
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1500 * (round + 1)));
  }
  throw new ProviderError("unavailable", lastError);
}
