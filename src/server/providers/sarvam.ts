import { redact } from "../../config/env";
import { ProviderError, classifyStatus } from "./errors";

export async function sarvamSpeak(opts: {
  apiKey: string;
  text: string;
  language: "en-IN" | "hi-IN";
  speaker?: string;
}): Promise<{ audio: Buffer; model: string; speaker: string }> {
  const attempts = [
    { model: "bulbul:v3", speaker: opts.speaker ?? "priya" },
  ];
  let last = "Sarvam was not called";
  for (const attempt of attempts) {
    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": opts.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text: opts.text,
        target_language_code: opts.language,
        speaker: attempt.speaker,
        model: attempt.model,
        pace: 1,
        speech_sample_rate: 22050,
      }),
    });
    const body = await response.text();
    if (!response.ok) {
      last = `${attempt.model} ${response.status} ${redact(body, [opts.apiKey])}`;
      if (response.status === 400 || response.status === 404 || response.status === 422) continue;
      throw new ProviderError(classifyStatus(response.status), last);
    }
    const parsed = JSON.parse(body) as { audios?: string[]; audio?: string };
    const b64 = parsed.audios?.[0] ?? parsed.audio;
    if (!b64) throw new ProviderError("invalid", "Sarvam returned no audio");
    return { audio: Buffer.from(b64, "base64"), model: attempt.model, speaker: attempt.speaker };
  }
  throw new ProviderError("invalid", last);
}
