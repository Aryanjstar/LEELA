import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve("spikes/showreel/reference-cut");
const words = (JSON.parse(readFileSync("spikes/showreel/reference-cut/words.json", "utf8")) as {
  words: { text: string; startMs: number; endMs: number }[];
}).words;

mkdirSync(resolve(root, "assets/fonts"), { recursive: true });
cpSync("spikes/showreel/_assets/gsap.min.js", resolve(root, "assets/gsap.min.js"));
cpSync("spikes/showreel/_assets/fonts", resolve(root, "assets/fonts"), { recursive: true });
writeFileSync(resolve(root, "hyperframes.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
  registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
  paths: { assets: "assets" },
}, null, 2));
writeFileSync(resolve(root, "package.json"), JSON.stringify({
  name: "reference-cut",
  private: true,
  type: "module",
  scripts: { check: "npx --yes hyperframes@0.8.176 check", render: "npx --yes hyperframes@0.8.176 render" },
}, null, 2));

const audioMs = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", resolve(root, "assets/vo.mp3")], { encoding: "utf8" }).trim()) * 1000;
const dur = audioMs / 1000 + 4.4;

const cuts = [0, 2.64, 4.37, 6.08, 9.3, 12.7, 15.58, 16.75, 18.58, 19.82, 21.48, 23.83, dur];

function scene(id: string, i: number, html: string) {
  const start = cuts[i];
  const end = cuts[i + 1];
  return `<section id="${id}" class="clip" data-start="${start.toFixed(3)}" data-duration="${(end - start).toFixed(3)}" data-track-index="2">${html}</section>`;
}

const scenes = [
  scene("s1", 0, `<div id="ring" class="ring"></div><div id="cross" class="cross"><i id="cx"></i><i id="cy"></i></div><p id="w1" class="mega">What if</p><div id="hookline" class="hline"></div><p id="w2" class="mid accent">the pixels.</p>`),
  scene("s2", 1, `<div id="vline" class="vline"></div><p id="small" class="tiny">you write</p><p id="idea" class="mega">the idea</p>`),
  scene("s3", 2, `<div id="c1" class="dot"></div><div id="c2" class="dot"></div><div id="c3" class="dot"></div><i id="wire1" class="wire w1"></i><i id="wire2" class="wire w2"></i><b id="n1" class="node">Idea</b><b id="n2" class="node">Plan</b><b id="n3" class="node">Render</b>`),
  scene("s4", 3, `<p id="bigpart" class="mega">names</p><p id="midpart" class="mid">we trust</p><div id="xmark" class="cross smallx"><i id="xx"></i><i id="xy"></i></div>`),
  scene("s5", 4, `<div id="orbit" class="ring bigring"></div><div class="ticks">${Array.from({ length: 8 }, (_, n) => `<i id="tk${n}"></i>`).join("")}</div><p id="timeword" class="mid">a time</p>`),
  scene("s6", 5, `<div id="win" class="win"><p class="tiny">compiler</p><p id="ln2">build(plan)</p><p id="ln3" class="accent">from times</p></div><div id="cursor" class="cursor"></div>`),
  scene("s7", 6, `<p id="no" class="mega">No.</p><div id="slash" class="slash"></div>`),
  scene("s8", 7, `<div id="path" class="path"></div><p id="trace" class="mid accent">A trace.</p>`),
  scene("s9", 8, `<div id="seal" class="ring"></div><p id="yes" class="mega">Yes.</p>`),
  scene("s10", 9, `<div id="arc" class="ring spin"></div><p id="rend" class="mid">Render</p><div id="bar" class="bar"></div>`),
  scene("s11", 10, `<div id="f1" class="frame"></div><div id="f2" class="frame"></div><div id="link" class="hline link"></div><p id="same" class="tiny">same frame</p>`),
  scene("s12", 11, `<div id="endring" class="ring"></div><div id="endline" class="hline endline"></div><p id="brand" class="mega">Leela</p><p id="hindi" class="hand">लीला</p><p id="hold" class="tiny">any idea, at play</p>`),
].join("\n");

const lines: { text: string; startMs: number; endMs: number }[][] = [];
let line: typeof words = [];
let width = 0;
for (const word of words) {
  const add = (width ? 1 : 0) + word.text.length;
  if (width && width + add > 26) {
    lines.push(line);
    line = [];
    width = 0;
  }
  line.push(word);
  width += (width ? 1 : 0) + word.text.length;
}
if (line.length) lines.push(line);

const pages: typeof lines[] = [];
for (let i = 0; i < lines.length; i += 2) pages.push(lines.slice(i, i + 2));

const capTweens: string[] = [];
const caps = pages.map((rows, p) => {
  const flat = rows.flat();
  const start = flat[0].startMs / 1000;
  const end = flat[flat.length - 1].endMs / 1000;
  let n = 0;
  const body = rows.map((row) => {
    const spans = row.map((word) => {
      const id = `cw${p}x${n}`;
      n += 1;
      const at = word.startMs / 1000;
      capTweens.push(`tl.fromTo("#${id}",{opacity:0.35},{opacity:1,duration:0.06,ease:"power2.out",immediateRender:false},${at.toFixed(3)});`);
      capTweens.push(`tl.to("#${id}",{opacity:0.35,duration:0.08,ease:"power2.in"},${(at + Math.max(0.12, (word.endMs - word.startMs) / 1000 - 0.06)).toFixed(3)});`);
      return `<span id="${id}">${word.text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")} </span>`;
    }).join("");
    return `<p>${spans}</p>`;
  }).join("");
  return `<div id="cap${p}" class="cap clip" data-start="${start.toFixed(3)}" data-duration="${Math.max(0.25, end - start).toFixed(3)}" data-track-index="4">${body}</div>`;
}).join("\n");

const html = `<!doctype html>
<html lang="en" data-resolution="portrait">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=1080, height=1920"/>
<title>Leela, the model never draws</title>
<script src="assets/gsap.min.js"></script>
<style>
@font-face{font-family:"Bricolage Grotesque";src:url("assets/fonts/bricolage.woff2") format("woff2");font-weight:800;font-display:block}
@font-face{font-family:"JetBrains Mono";src:url("assets/fonts/mono.woff2") format("woff2");font-weight:500;font-display:block}
@font-face{font-family:Kalam;src:url("assets/fonts/kalam-deva.woff2") format("woff2");font-weight:700;font-display:block;unicode-range:U+0900-097F}
@font-face{font-family:Caveat;src:url("assets/fonts/caveat.woff2") format("woff2");font-weight:700;font-display:block}
*{box-sizing:border-box}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#0C0E14}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:#0C0E14;color:#F4F0E6;font-family:"Bricolage Grotesque",sans-serif}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(244,240,230,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(244,240,230,.07) 1px,transparent 1px);background-size:72px 72px}
.clip{position:absolute;inset:0}
.mega{position:absolute;left:80px;top:560px;margin:0;width:920px;font-size:168px;line-height:.86;font-weight:800;letter-spacing:-.055em}
.mid{position:absolute;left:90px;top:860px;margin:0;width:880px;font-size:84px;line-height:.95;font-weight:800;letter-spacing:-.04em}
.tiny{position:absolute;left:100px;top:420px;margin:0;font-family:"JetBrains Mono",monospace;font-size:34px;color:#FFB020}
.accent{color:#FFB020}
.ring{position:absolute;left:250px;top:480px;width:580px;height:580px;border-radius:50%;border:8px solid #FFB020}
.bigring{left:150px;top:560px;width:780px;height:420px;border-width:6px}
.cross{position:absolute;left:390px;top:700px;width:300px;height:300px}
.cross i{position:absolute;left:146px;top:0;width:8px;height:300px;background:#F4F0E6;border-radius:4px;transform-origin:50% 50%}
.cross i:last-child{left:0;top:146px;width:300px;height:8px}
.smallx{left:700px;top:980px;width:160px;height:160px}
.smallx i{left:76px;height:160px}
.smallx i:last-child{left:0;top:76px;width:160px;height:8px}
.hline{position:absolute;left:90px;top:800px;width:760px;height:8px;background:#FFB020;border-radius:4px;transform-origin:0 50%}
.vline{position:absolute;left:100px;top:360px;width:8px;height:900px;background:#FFB020;border-radius:4px;transform-origin:50% 0}
.slash{position:absolute;left:80px;top:640px;width:900px;height:14px;background:#FFB020;border-radius:7px;transform-origin:0 50%}
.path{position:absolute;left:100px;top:700px;width:820px;height:8px;background:#FFB020;border-radius:4px;transform-origin:0 50%}
.dot{position:absolute;top:760px;width:36px;height:36px;border-radius:50%;background:#FFB020}
#c1{left:150px}#c2{left:500px}#c3{left:850px}
.wire{position:absolute;top:774px;height:6px;background:#F4F0E6;transform-origin:0 50%}
.w1{left:186px;width:314px}.w2{left:536px;width:314px}
.node{position:absolute;top:860px;width:240px;text-align:center;font-size:40px}
#n1{left:50px}#n2{left:400px}#n3{left:750px}
.cursor{position:absolute;left:140px;top:640px;width:22px;height:22px;border-right:4px solid #FFB020;border-bottom:4px solid #FFB020}
.kicker{position:absolute;left:100px;top:340px;margin:0;font-family:"JetBrains Mono",monospace;font-size:32px;color:#FFB020}
.field{position:absolute;left:100px;top:620px;width:820px;height:160px;border-radius:24px;background:#171B24;display:flex;align-items:center;padding:0 36px;font-size:64px;font-weight:800}
#caret{display:block;width:4px;height:64px;margin-left:12px;background:#FFB020}
.nodes{position:absolute;left:80px;top:640px;width:920px;display:flex;align-items:center;gap:18px}
.nodes b{width:220px;height:120px;border-radius:22px;background:#171B24;display:grid;place-items:center;font-size:36px}
.nodes i{width:48px;height:4px;background:#FFB020;transform-origin:0 50%}
.chip{position:absolute;left:120px;height:120px;width:760px;border-radius:24px;background:#171B24;display:flex;align-items:center;padding:0 32px;font-family:"JetBrains Mono",monospace;font-size:36px}
#p1{top:500px}#p2{top:660px}#p3{top:820px}
.ticks{position:absolute;left:120px;top:700px;display:flex;gap:22px;align-items:flex-end;height:280px}
.ticks i{display:block;width:64px;height:40px;background:#FFB020;border-radius:8px;transform-origin:50% 100%}
.win{position:absolute;left:100px;top:520px;width:860px;background:#171B24;border-radius:24px;padding:40px;font-family:"JetBrains Mono",monospace;font-size:36px;line-height:1.6}
.win p{margin:0}
.draw{position:absolute;left:120px;top:1100px;width:760px;height:8px;background:#FFB020;border-radius:4px;transform-origin:0 50%}
.stamp{position:absolute;left:160px;top:700px;width:760px;height:220px;border:8px solid #FFB020;border-radius:28px;color:#FFB020;display:grid;place-items:center;font-size:92px;font-weight:800;letter-spacing:-.04em}
.bar{position:absolute;left:120px;top:980px;height:18px;width:820px;background:#FFB020;border-radius:9px;transform-origin:0 50%}
.frame{position:absolute;top:560px;width:360px;height:520px;border-radius:28px;background:#171B24;display:grid;place-items:center;font-size:40px;font-weight:800}
#f1{left:120px}#f2{left:560px}
#same{top:1160px}
.hand{position:absolute;left:100px;top:860px;margin:0;font-family:Caveat,cursive;font-size:92px;color:#FFB020}
#hold{top:1080px;color:#F4F0E6}
.endline{top:800px}
.cap{left:90px;width:880px;top:1460px;text-align:left}
.cap p{margin:0;font-size:40px;font-weight:700;line-height:1.25;text-shadow:-3px 0 0 #0C0E14,3px 0 0 #0C0E14,0 -3px 0 #0C0E14,0 3px 0 #0C0E14}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${dur.toFixed(3)}" data-width="1080" data-height="1920">
  <div class="grid"></div>
  ${scenes}
  ${caps}
  <audio id="vo" src="assets/vo.mp3" data-start="0" data-duration="${(audioMs / 1000).toFixed(3)}" data-track-index="6" data-volume="1"></audio>
</div>
<script>
const tl = gsap.timeline({ paused: true });
tl.fromTo("#ring", { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "power4.out", immediateRender: false }, 0.02);
tl.fromTo("#w1", { scale: 1.45, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: "power4.out", immediateRender: false }, 0.12);
tl.fromTo("#hookline", { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power3.out", immediateRender: false }, 0.55);
tl.fromTo("#cx", { scaleY: 0 }, { scaleY: 1, duration: 0.22, ease: "power4.out", immediateRender: false }, 1.05);
tl.fromTo("#cy", { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: "power4.out", immediateRender: false }, 1.18);
tl.fromTo("#w2", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.34, ease: "power4.out", immediateRender: false }, 1.35);
tl.fromTo("#vline", { scaleY: 0 }, { scaleY: 1, duration: 0.4, ease: "power3.out", immediateRender: false }, 2.7);
tl.fromTo("#small", { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, 2.85);
tl.fromTo("#idea", { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "power4.out", immediateRender: false }, 3.15);
tl.fromTo("#c1", { scale: 0 }, { scale: 1, duration: 0.25, ease: "back.out(1.6)", immediateRender: false }, 4.45);
tl.fromTo("#wire1", { scaleX: 0 }, { scaleX: 1, duration: 0.28, ease: "power2.out", immediateRender: false }, 4.7);
tl.fromTo("#c2", { scale: 0 }, { scale: 1, duration: 0.25, ease: "back.out(1.6)", immediateRender: false }, 4.95);
tl.fromTo("#wire2", { scaleX: 0 }, { scaleX: 1, duration: 0.28, ease: "power2.out", immediateRender: false }, 5.2);
tl.fromTo("#c3", { scale: 0 }, { scale: 1, duration: 0.25, ease: "back.out(1.6)", immediateRender: false }, 5.45);
tl.fromTo("#n1", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power3.out", immediateRender: false }, 4.6);
tl.fromTo("#n2", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power3.out", immediateRender: false }, 5.1);
tl.fromTo("#n3", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power3.out", immediateRender: false }, 5.6);
tl.fromTo("#bigpart", { scale: 1.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power4.out", immediateRender: false }, 6.2);
tl.fromTo("#midpart", { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power3.out", immediateRender: false }, 7.1);
tl.fromTo("#xx", { scaleY: 0 }, { scaleY: 1, duration: 0.18, ease: "power4.out", immediateRender: false }, 7.9);
tl.fromTo("#xy", { scaleX: 0 }, { scaleX: 1, duration: 0.18, ease: "power4.out", immediateRender: false }, 8.05);
${Array.from({ length: 8 }, (_, n) => `tl.fromTo("#tk${n}",{scaleY:0.15},{scaleY:${0.6 + (n % 4) * 0.55},duration:0.16,ease:"power3.out",immediateRender:false},${(9.45 + n * 0.22).toFixed(2)});`).join("\n")}
tl.fromTo("#orbit", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out", immediateRender: false }, 9.4);
tl.fromTo("#timeword", { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power4.out", immediateRender: false }, 11.2);
tl.fromTo("#win", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, ease: "power3.out", immediateRender: false }, 12.85);
tl.fromTo("#ln2", { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.25, immediateRender: false }, 13.55);
tl.fromTo("#ln3", { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.25, immediateRender: false }, 14.35);
tl.fromTo("#cursor", { x: 0, y: 0, opacity: 0 }, { x: 420, y: 80, opacity: 1, duration: 0.7, ease: "power2.inOut", immediateRender: false }, 13.2);
tl.fromTo("#no", { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.26, ease: "power4.out", immediateRender: false }, 15.62);
tl.fromTo("#slash", { scaleX: 0, rotation: -18 }, { scaleX: 1, rotation: -12, duration: 0.22, ease: "power4.out", immediateRender: false }, 16.05);
tl.fromTo("#path", { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power2.out", immediateRender: false }, 16.9);
tl.fromTo("#trace", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: "power3.out", immediateRender: false }, 17.3);
tl.fromTo("#seal", { scale: 1.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "power4.out", immediateRender: false }, 18.65);
tl.fromTo("#yes", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.28, ease: "power4.out", immediateRender: false }, 18.9);
tl.fromTo("#arc", { scale: 0.3, rotation: -40, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: "power3.out", immediateRender: false }, 19.95);
tl.fromTo("#rend", { opacity: 0 }, { opacity: 1, duration: 0.25, immediateRender: false }, 20.3);
tl.fromTo("#bar", { scaleX: 0 }, { scaleX: 1, duration: 1.05, ease: "power2.inOut", immediateRender: false }, 20.2);
tl.fromTo("#f1", { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power3.out", immediateRender: false }, 21.55);
tl.fromTo("#link", { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power2.out", immediateRender: false }, 21.9);
tl.fromTo("#f2", { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power3.out", immediateRender: false }, 22.15);
tl.fromTo("#endring", { scale: 0.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: "power3.out", immediateRender: false }, 23.9);
tl.fromTo("#brand", { scale: 1.35, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "power4.out", immediateRender: false }, 24.05);
tl.fromTo("#endline", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.out", immediateRender: false }, 24.7);
tl.fromTo("#hindi", { y: 18, opacity: 0, rotation: -7 }, { y: 0, opacity: 1, rotation: -3, duration: 0.4, ease: "power3.out", immediateRender: false }, 25.15);
tl.fromTo("#hold", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 25.8);
${capTweens.join("\n")}
window.__timelines["main"] = tl;
</script>
</body>
</html>`;

writeFileSync(resolve(root, "index.html"), html);
console.log(`wrote ${dur.toFixed(2)}s ${words.length} words`);
