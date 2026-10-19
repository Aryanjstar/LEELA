import { execFileSync } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "../src/config/env";
import { listVoices, pickVoice, synthesize } from "../src/server/providers/elevenlabs";

const films: [string, string][] = [
  ["code-lab", "Code Lab. Find twenty one. Left, middle, and right move from a real trace. Too low. Then found."],
  ["launch", "Any idea, at play. Explainer, Code Lab, and Story. The model plans. You approve. Code renders."],
  ["wedding", "The Wedding Home. One house for every function. Haldi, mehendi, and the pheras."],
  ["story", "A spinning top should fall. It does not. Ek lattu. An original story."],
  ["guests", "The guest list. Aisha, Dev, Farah, Kabir. One name, then the next."],
];

const env = loadEnv();
if (!env.elevenLabsApiKey) {
  console.error("ELEVENLABS_API_KEY is missing");
  process.exit(1);
}
const voice = pickVoice(await listVoices(env.elevenLabsApiKey));
console.log("voice", voice.name);

for (const [name, text] of films) {
  const take = await synthesize({ apiKey: env.elevenLabsApiKey, voiceId: voice.id, text });
  const mp3 = resolve("/tmp", `leela-${name}.mp3`);
  const out = resolve("/tmp", `leela-${name}-voiced.mp4`);
  const src = resolve("public/films", `${name}.mp4`);
  writeFileSync(mp3, take.audio);
  execFileSync("ffmpeg", [
    "-y", "-i", src, "-i", mp3,
    "-filter_complex", "[1:a]apad[a]",
    "-map", "0:v", "-map", "[a]",
    "-c:v", "copy", "-c:a", "aac", "-shortest", out,
  ], { stdio: "inherit" });
  copyFileSync(out, src);
  console.log("voiced", name);
}
