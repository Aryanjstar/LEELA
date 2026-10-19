import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { compileProject } from "../src/compiler/compile.js";
import type { Plan } from "../src/contracts/plan.js";
import type { Timeline } from "../src/compiler/compile.js";

const root = process.cwd();
const projectDir = resolve(root, "spikes/s1-render/out/project");
const plan = JSON.parse(readFileSync(resolve(root, "spikes/s4-planner/out/plan-1.json"), "utf8")) as Plan;
plan.voiceId = "elevenlabs:Alice";
const timeline = JSON.parse(readFileSync(resolve(projectDir, "timeline.json"), "utf8")) as Timeline;
compileProject({ plan, timeline, outDir: projectDir });
execFileSync("npx", ["--yes", "hyperframes@0.8.176", "check"], { cwd: projectDir, stdio: "inherit" });
const output = resolve(root, "spikes/s1-render/out/why-the-moon-misses.mp4");
const started = Date.now();
execFileSync("npx", ["--yes", "hyperframes@0.8.176", "render", "--quality", "draft", "--output", output], {
  cwd: projectDir,
  stdio: "inherit",
});
console.log(`render_ms ${Date.now() - started}`);
const loud = output.replace(/\.mp4$/, ".loud.mp4");
execFileSync("ffmpeg", [
  "-y", "-i", output,
  "-ar", "48000",
  "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
  loud,
], { stdio: "inherit" });
execFileSync("mv", [loud, output]);
