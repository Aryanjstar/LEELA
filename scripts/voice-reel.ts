import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "../src/config/env.js";
import { listVoices, pickVoice, synthesize } from "../src/server/providers/elevenlabs.js";

const text = [
  "What if the model never touched the pixels.",
  "You write the idea.",
  "Leela writes a plan. Only names of parts we already trust.",
  "A voice speaks, and every word gets a time.",
  "The compiler builds the film from those times.",
  "Not a guess. A trace of the sentence.",
  "You approve it. Then it renders.",
  "The same frame, every time you ask.",
  "Leela.",
].join(" ");

const env = loadEnv();
const voices = await listVoices(env.elevenLabsApiKey);
const voice = pickVoice(voices);
const take = await synthesize({ apiKey: env.elevenLabsApiKey, voiceId: voice.id, text });
const dir = resolve("spikes/showreel/reference-cut");
mkdirSync(resolve(dir, "assets"), { recursive: true });
writeFileSync(resolve(dir, "assets/vo.mp3"), take.audio);
writeFileSync(resolve(dir, "words.json"), JSON.stringify({ voice: voice.name, text, words: take.words }, null, 2));
const end = take.words[take.words.length - 1]?.endMs ?? 0;
console.log(`${voice.name} ${take.words.length} words ${end}ms`);
