import { loadEnv, redact } from "../src/config/env.js";

const env = loadEnv();
const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
  headers: { "x-goog-api-key": env.geminiApiKey },
});
const body = await response.text();
if (!response.ok) {
  console.log(response.status, redact(body, [env.geminiApiKey]));
  process.exit(1);
}
const parsed = JSON.parse(body) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
for (const model of parsed.models ?? []) {
  if ((model.supportedGenerationMethods ?? []).includes("generateContent")) {
    console.log(model.name.replace("models/", ""));
  }
}
