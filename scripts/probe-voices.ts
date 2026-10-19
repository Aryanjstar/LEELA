import { loadEnv, redact } from "../src/config/env.js";

const env = loadEnv();

for (const name of ["Zara", "Anika", "Tripti"]) {
  const res = await fetch(`https://api.elevenlabs.io/v1/shared-voices?page_size=10&search=${encodeURIComponent(name)}`, {
    headers: { "xi-api-key": env.elevenLabsApiKey },
  });
  const data = (await res.json()) as { voices?: { name: string; voice_id: string; accent?: string; gender?: string; use_case?: string }[] };
  console.log(`\n${name}`);
  for (const voice of data.voices ?? []) {
    console.log(`- ${voice.name} | ${voice.accent ?? ""} | ${voice.use_case ?? ""} | ${voice.voice_id}`);
  }
}

const sarvam = await fetch("https://api.sarvam.ai/text-to-speech", {
  method: "POST",
  headers: { "api-subscription-key": env.sarvamApiKey, "content-type": "application/json" },
  body: JSON.stringify({
    text: "चाँद गिर रहा है, पर ज़मीन हर बार हट जाती है।",
    target_language_code: "hi-IN",
    speaker: "priya",
    model: "bulbul:v3",
    pace: 1,
  }),
});
const body = await sarvam.text();
console.log("\nSARVAM", sarvam.status, redact(body, [env.sarvamApiKey]).slice(0, 180));

const tts = await fetch("https://api.elevenlabs.io/v1/text-to-speech/ar9DfDj8Fdc0MFTARzMC/with-timestamps", {
  method: "POST",
  headers: { "xi-api-key": env.elevenLabsApiKey, "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ text: "The moon is falling.", model_id: "eleven_multilingual_v2" }),
});
const ttsBody = await tts.text();
console.log("TRIPTI", tts.status, redact(ttsBody, [env.elevenLabsApiKey]).slice(0, 160));
