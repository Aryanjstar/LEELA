import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { loadEnv } from "../src/config/env.js";
import { compileProject } from "../src/compiler/compile.js";
import { buildTimeline, narrate, planTopic, stampVoice, writeHindiSample } from "../src/pipeline/make.js";

const TOPICS = [
  "Why a spinning top and the moon stay up for the same reason. For a curious 12 year old. About 45 seconds.",
  "How binary search finds one name in a sorted wedding guest list of 10000 names. It takes 14 checks because each check throws away half.",
  "Why the sky looks blue. For a 12 year old. No invented numbers.",
  "Why ice floats on water. For a 12 year old. No invented numbers.",
  "How a lock lets one key through and stops the others. For a 12 year old. No invented numbers.",
];

const env = loadEnv();
const root = process.cwd();
const planDir = resolve(root, "spikes/s4-planner/out");
mkdirSync(planDir, { recursive: true });

const plans = [];
for (const [index, topic] of TOPICS.entries()) {
  process.stdout.write(`plan ${index + 1}/5\n`);
  const result = await planTopic(env.geminiApiKey, topic);
  plans.push({ topic, model: result.model, repairs: result.repairs, title: result.plan.title, scenes: result.plan.scenes.length });
  writeFileSync(resolve(planDir, `plan-${index + 1}.json`), JSON.stringify(result.plan, null, 2));
}
writeFileSync(resolve(planDir, "summary.json"), JSON.stringify(plans, null, 2));
console.log(JSON.stringify(plans, null, 2));

const moon = JSON.parse(await import("node:fs").then((fs) => fs.readFileSync(resolve(planDir, "plan-1.json"), "utf8")));
const projectDir = resolve(root, "spikes/s1-render/out/project");
const audioDir = resolve(projectDir, "assets");
mkdirSync(audioDir, { recursive: true });
console.log("narrating");
const voice = await narrate({ apiKey: env.elevenLabsApiKey, plan: moon, audioDir });
const plan = stampVoice(moon, `elevenlabs:${voice.voiceName}`);
const timeline = buildTimeline(plan, voice.clips);
compileProject({ plan, timeline, outDir: projectDir });
mkdirSync(resolve(root, "spikes/s2-voice/out"), { recursive: true });
writeFileSync(resolve(root, "spikes/s2-voice/out/meta.json"), JSON.stringify({
  voice: voice.voiceName,
  voiceId: voice.voiceId,
  model: voice.model,
  lines: voice.clips.map((clip) => ({ id: `${clip.sceneId}-${clip.lineId}`, words: clip.words.length, ms: clip.durationMs })),
}, null, 2));

console.log("hindi sample");
const hindi = await writeHindiSample(env.sarvamApiKey, resolve(root, "spikes/s2-voice/out/hindi.wav"));
console.log(JSON.stringify({ hindi, seconds: (timeline.durationMs / 1000).toFixed(2), voice: voice.voiceName }));

console.log("check");
execFileSync("npx", ["--yes", "hyperframes@0.8.176", "check"], { cwd: projectDir, stdio: "inherit" });

const output = resolve(root, "spikes/s1-render/out/why-the-moon-misses.mp4");
console.log("render");
const started = Date.now();
execFileSync("npx", ["--yes", "hyperframes@0.8.176", "render", "--quality", "draft", "--output", output], {
  cwd: projectDir,
  stdio: "inherit",
});
console.log(`render_ms ${Date.now() - started}`);
