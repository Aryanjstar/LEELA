import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "../src/config/env";
import { listVoices, pickVoice, synthesize, type WordTiming } from "../src/server/providers/elevenlabs";

type Beat = { id: string; phrase: string; html: string };

function seconds(file: string): number {
  return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).trim());
}

function at(words: WordTiming[], phrase: string): number {
  const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const heard = words.map((word) => clean(word.text));
  const needle = phrase.toLowerCase().split(/\s+/).map(clean).filter(Boolean);
  for (let i = 0; i <= heard.length - needle.length; i++) {
    if (needle.every((part, j) => heard[i + j]?.startsWith(part))) return words[i].startMs / 1000;
  }
  return words[0]?.startMs / 1000 || 0.2;
}

function captions(words: WordTiming[], light: boolean): string {
  const groups: WordTiming[][] = [];
  for (let i = 0; i < words.length; i += 3) groups.push(words.slice(i, i + 3));
  return groups.map((group, index) => {
    const start = group[0].startMs / 1000;
    const end = group[group.length - 1].endMs / 1000;
    const text = group.map((word) => word.text).join(" ");
    return `<div class="cap clip ${light ? "light" : ""}" data-start="${start.toFixed(3)}" data-duration="${Math.max(0.25, end - start).toFixed(3)}" data-track-index="3"><p>${text}</p></div>`;
  }).join("\n");
}

const css = (bg: string, fg: string, accent: string) => `
  @font-face { font-family: Display; src: url("assets/fonts/display.woff2") format("woff2"); font-weight: 800; }
  @font-face { font-family: Mono; src: url("assets/fonts/mono.woff2") format("woff2"); font-weight: 500; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: ${bg}; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${bg}; color: ${fg}; font-family: Display, sans-serif; }
  .clip { position: absolute; inset: 0; }
  .world { position: absolute; inset: 0; }
  .cap { left: 80px; right: 80px; bottom: 180px; }
  .cap p { margin: 0; font-size: 48px; line-height: 1.15; font-weight: 800; color: #fff; text-shadow: 0 2px 18px rgba(0,0,0,.7); }
  .cap.light p { color: #1b1530; text-shadow: none; }
  .kicker { position: absolute; left: 80px; top: 220px; margin: 0; letter-spacing: 0.16em; font-size: 28px; color: ${accent}; font-family: Mono, monospace; }
  .cells { position: absolute; left: 70px; top: 720px; display: flex; gap: 14px; }
  .cell { width: 140px; height: 150px; border-radius: 28px; background: #16213F; display: grid; place-items: center; font-family: Mono, monospace; font-size: 44px; opacity: 0; }
  .ptr { position: absolute; top: 640px; left: 70px; width: 0; height: 0; border-left: 16px solid transparent; border-right: 16px solid transparent; border-top: 22px solid ${accent}; opacity: 0; }
  .lattu { position: absolute; left: 400px; top: 520px; width: 280px; height: 340px; background: ${accent}; clip-path: polygon(50% 0, 100% 82%, 0 82%); transform-origin: 50% 80%; }
  .ground { position: absolute; left: 120px; right: 120px; top: 980px; height: 4px; background: ${fg}; transform-origin: 0 50%; }
  .moon { position: absolute; right: 160px; top: 280px; width: 160px; height: 160px; border-radius: 50%; background: #F3E6C8; opacity: 0; }
  .idea { position: absolute; left: 80px; top: 420px; margin: 0; font-size: 140px; line-height: .9; font-weight: 800; letter-spacing: -0.05em; }
  .door { position: absolute; left: 80px; width: 920px; height: 140px; border-radius: 24px; border: 2px solid rgba(244,244,244,.35); display: flex; align-items: center; padding: 0 36px; font-size: 56px; font-weight: 800; opacity: 0; }
  .chat { position: absolute; width: 280px; height: 90px; border-radius: 20px; background: #2A2118; opacity: 0; }
  .board { position: absolute; left: 100px; top: 480px; width: 880px; }
  .ev { height: 110px; margin: 12px 0; border-radius: 18px; background: #2A2118; color: ${accent}; display: flex; align-items: center; padding: 0 28px; font-size: 42px; font-weight: 800; opacity: 0; }
`;

function page(opts: { title: string; bg: string; fg: string; accent: string; light: boolean; total: number; world: string; captions: string; tweens: string }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><title>${opts.title}</title>
<script src="assets/gsap.min.js"></script>
<style>${css(opts.bg, opts.fg, opts.accent)}</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${opts.total.toFixed(3)}" data-width="1080" data-height="1920">
  <section class="clip" id="world" data-start="0" data-duration="${opts.total.toFixed(3)}" data-track-index="1">${opts.world}</section>
  ${opts.captions}
  <audio id="vo" src="assets/vo.mp3" data-start="0" data-duration="${opts.total.toFixed(3)}" data-track-index="4" data-volume="1"></audio>
</div>
<script>
const tl = gsap.timeline({ paused: true });
${opts.tweens}
window.__timelines["main"] = tl;
</script></body></html>`;
}

const env = loadEnv();
if (!env.elevenLabsApiKey) {
  console.error("ELEVENLABS_API_KEY is missing");
  process.exit(1);
}
const voice = pickVoice(await listVoices(env.elevenLabsApiKey));
console.log("voice", voice.name);

const jobs: { id: string; say: string; build: (words: WordTiming[], total: number) => string }[] = [
  {
    id: "find",
    say: "You have a sorted list, and you need the number twenty one. Reading every box would take forever, so you check the middle instead. Fifteen is too low, so twenty one sits to the right. Twenty eight is too high, so you look left. There it is. Twenty one, found in three checks.",
    build: (words, total) => page({
      title: "Find 21", bg: "#0B1020", fg: "#E8F7FF", accent: "#3DE3F5", light: false, total,
      captions: captions(words, false),
      world: `<p class="kicker" id="k">FIND 21</p><div class="ptr" id="ptr"></div><div class="cells">${[4, 9, 15, 21, 28, 33].map((n, i) => `<div class="cell" id="c${i}">${n}</div>`).join("")}</div>`,
      tweens: `
        tl.fromTo("#k", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 0.15);
        ${[0, 1, 2, 3, 4, 5].map((i) => `tl.fromTo("#c${i}", { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, ${(at(words, "sorted list") + i * 0.06).toFixed(3)});`).join("\n")}
        tl.fromTo("#ptr", { opacity: 0, x: 312 }, { opacity: 1, x: 312, duration: 0.25, ease: "power2.out" }, ${at(words, "middle").toFixed(3)});
        tl.to("#c2", { backgroundColor: "#3DE3F5", color: "#0B1020", duration: 0.2 }, ${at(words, "fifteen").toFixed(3)});
        tl.to("#ptr", { x: 624, duration: 0.45, ease: "power2.inOut" }, ${at(words, "right").toFixed(3)});
        tl.to("#c4", { backgroundColor: "#FF5FA2", color: "#0B1020", duration: 0.2 }, ${at(words, "twenty eight").toFixed(3)});
        tl.to("#ptr", { x: 468, duration: 0.45, ease: "power3.out" }, ${at(words, "look left").toFixed(3)});
        tl.to("#c3", { backgroundColor: "#B8F35B", color: "#0B1020", scale: 1.12, duration: 0.35, ease: "back.out(1.4)" }, ${at(words, "there it is").toFixed(3)});
      `,
    }),
  },
  {
    id: "top",
    say: "A spinning top should fall the moment you let go. What you do is give it a spin. While it turns, that spin pulls the top upright every time it tips. Take the spin away and it falls at once. That is the whole trick.",
    build: (words, total) => page({
      title: "Why it stays up", bg: "#FBF4E8", fg: "#2A2238", accent: "#0E7C72", light: true, total,
      captions: captions(words, true),
      world: `<div class="ground" id="ground"></div><div class="lattu" id="top"></div>`,
      tweens: `
        tl.fromTo("#ground", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, 0.1);
        tl.fromTo("#top", { y: -80, opacity: 0, rotation: 22 }, { y: 0, opacity: 1, rotation: 22, duration: 0.55, ease: "power3.out" }, ${at(words, "spinning top").toFixed(3)});
        tl.to("#top", { rotation: 400, duration: 1.6, ease: "power1.inOut" }, ${at(words, "give it a spin").toFixed(3)});
        tl.to("#top", { rotation: 0, duration: 0.7, ease: "power3.out" }, ${at(words, "upright").toFixed(3)});
        tl.to("#top", { rotation: 68, y: 30, duration: 0.45, ease: "power2.in" }, ${at(words, "falls").toFixed(3)});
        tl.to("#top", { rotation: 0, y: 0, duration: 0.5, ease: "back.out(1.4)" }, ${at(words, "whole trick").toFixed(3)});
      `,
    }),
  },
  {
    id: "story",
    say: "There was a lattu that should have fallen. A child gave it a string and a spin, and it walked the whole courtyard. The moon does the same thing up in the sky. It never lands.",
    build: (words, total) => page({
      title: "Ek lattu", bg: "#1B2438", fg: "#F6F1E7", accent: "#E2A23A", light: false, total,
      captions: captions(words, false),
      world: `<div class="ground" id="ground"></div><div class="lattu" id="toy"></div><div class="moon" id="moon"></div>`,
      tweens: `
        tl.fromTo("#ground", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.out" }, 0.1);
        tl.fromTo("#toy", { x: -40, opacity: 0, rotation: 20 }, { x: -40, opacity: 1, rotation: 20, duration: 0.45, ease: "power3.out" }, ${at(words, "lattu").toFixed(3)});
        tl.to("#toy", { rotation: 360, duration: 1.1, ease: "power1.inOut" }, ${at(words, "spin").toFixed(3)});
        tl.to("#toy", { x: 280, rotation: 20, duration: 1.4, ease: "power2.inOut" }, ${at(words, "walked").toFixed(3)});
        tl.fromTo("#moon", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, ${at(words, "moon").toFixed(3)});
      `,
    }),
  },
  {
    id: "launch",
    say: "An idea sits in your head and goes nowhere. Leela opens three doors. An explainer, a code lab, and a story. The model writes a plan of named scenes. You read that plan and you approve it. Then trusted code renders the film.",
    build: (words, total) => page({
      title: "Any idea", bg: "#0A0A0A", fg: "#F4F4F4", accent: "#F4F4F4", light: false, total,
      captions: captions(words, false),
      world: `<p class="idea" id="idea">An idea.</p><div class="door" id="d1" style="top:700px">Explainer</div><div class="door" id="d2" style="top:860px">Code lab</div><div class="door" id="d3" style="top:1020px">Story</div>`,
      tweens: `
        tl.fromTo("#idea", { scale: 1.18, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "power4.out" }, ${at(words, "idea").toFixed(3)});
        tl.fromTo("#d1", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, ${at(words, "explainer").toFixed(3)});
        tl.fromTo("#d2", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, ${at(words, "code lab").toFixed(3)});
        tl.fromTo("#d3", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, ${at(words, "story").toFixed(3)});
        tl.to("#idea", { opacity: 0.35, duration: 0.3 }, ${at(words, "plan").toFixed(3)});
      `,
    }),
  },
  {
    id: "house",
    say: "A wedding scattered across ten family chats is hard to hold. Mehendi, the baraat, and the wedding day belong on one board. A guest never makes an account. They open one link, and the whole family is already there.",
    build: (words, total) => page({
      title: "One house", bg: "#1A120C", fg: "#F6F1E7", accent: "#E8C872", light: false, total,
      captions: captions(words, false),
      world: `<div class="chat" id="b1" style="left:80px;top:300px"></div><div class="chat" id="b2" style="left:700px;top:360px"></div><div class="chat" id="b3" style="left:200px;top:1280px"></div><div class="board"><div class="ev" id="e1">Mehendi</div><div class="ev" id="e2">Baraat</div><div class="ev" id="e3">Wedding</div></div>`,
      tweens: `
        tl.fromTo("#b1", { x: -30, opacity: 0 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }, ${at(words, "chats").toFixed(3)});
        tl.fromTo("#b2", { y: -20, opacity: 0 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, ${(at(words, "chats") + 0.12).toFixed(3)});
        tl.fromTo("#b3", { y: 20, opacity: 0 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, ${(at(words, "chats") + 0.24).toFixed(3)});
        tl.to("#b1, #b2, #b3", { opacity: 0.2, duration: 0.3 }, ${at(words, "one board").toFixed(3)});
        tl.fromTo("#e1", { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, ${at(words, "mehendi").toFixed(3)});
        tl.fromTo("#e2", { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, ${at(words, "baraat").toFixed(3)});
        tl.fromTo("#e3", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, ${at(words, "wedding day").toFixed(3)});
      `,
    }),
  },
];

const gsap = resolve("node_modules/gsap/dist/gsap.min.js");
const display = resolve("node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2");
const mono = resolve("node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2");

for (const job of jobs) {
  const root = resolve("spikes/site-films", job.id);
  mkdirSync(resolve(root, "assets/fonts"), { recursive: true });
  copyFileSync(gsap, resolve(root, "assets/gsap.min.js"));
  copyFileSync(display, resolve(root, "assets/fonts/display.woff2"));
  copyFileSync(mono, resolve(root, "assets/fonts/mono.woff2"));
  const take = await synthesize({ apiKey: env.elevenLabsApiKey, voiceId: voice.id, text: job.say });
  writeFileSync(resolve(root, "assets/vo.mp3"), take.audio);
  const total = seconds(resolve(root, "assets/vo.mp3")) + 0.45;
  writeFileSync(resolve(root, "index.html"), job.build(take.words, total));
  writeFileSync(resolve(root, "hyperframes.json"), JSON.stringify({
    $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
    paths: { assets: "assets" },
  }, null, 2));
  console.log("built", job.id, total.toFixed(1), "words", take.words.length);
}
