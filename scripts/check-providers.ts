import { loadEnv, redact } from "../src/config/env.js";
import { geminiJson } from "../src/server/providers/gemini.js";
import { listVoices, pickVoice } from "../src/server/providers/elevenlabs.js";
import { sarvamSpeak } from "../src/server/providers/sarvam.js";
import { ProviderError } from "../src/server/providers/errors.js";

const env = loadEnv();

function line(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? "ok" : "FAIL"}  ${name}  ${detail}`);
}

const gemini = await (async () => {
  if (!env.geminiApiKey) return line("gemini", false, "no key");
  try {
    const result = await geminiJson({
      apiKey: env.geminiApiKey,
      system: "Return JSON.",
      user: 'Return {"title":"ping","logline":"pong","scenes":[]}',
    });
    return line("gemini", true, result.model);
  } catch (error) {
    const message = error instanceof ProviderError ? error.message : "failed";
    return line("gemini", false, redact(message, [env.geminiApiKey]));
  }
})();

const labs = await (async () => {
  if (!env.elevenLabsApiKey) return line("elevenlabs", false, "no key");
  try {
    const voices = await listVoices(env.elevenLabsApiKey);
    const pick = pickVoice(voices);
    const named = voices.filter((voice) => ["zara", "anika", "tripti"].includes(voice.name.toLowerCase())).map((voice) => voice.name);
    return line("elevenlabs", true, `voices=${voices.length} pick=${pick.name} named=${named.join(",") || "none"}`);
  } catch (error) {
    const message = error instanceof ProviderError ? error.message : "failed";
    return line("elevenlabs", false, redact(message, [env.elevenLabsApiKey]));
  }
})();

const sarvam = await (async () => {
  if (!env.sarvamApiKey) return line("sarvam", false, "no key");
  try {
    const take = await sarvamSpeak({ apiKey: env.sarvamApiKey, language: "hi-IN", text: "नमस्ते" });
    return line("sarvam", true, `${take.model} ${take.speaker} ${take.audio.length} bytes`);
  } catch (error) {
    const message = error instanceof ProviderError ? error.message : "failed";
    return line("sarvam", false, redact(message, [env.sarvamApiKey]));
  }
})();

void gemini;
void labs;
void sarvam;
