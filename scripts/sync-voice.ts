import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "../src/config/env";
import { listVoices, pickVoice, synthesize } from "../src/server/providers/elevenlabs";

const films: { src: string; out: string; text: string }[] = [
  {
    src: "spikes/showreel/out/code-lab.mp4",
    out: "public/films/code-lab.mp4",
    text: "The problem is a sorted list, and 21 is hiding in it. We do not check every number. We check the middle. Fifteen is too low, so we look right. Twenty eight is too high, so we look left. Twenty one is the middle. Found, in three checks.",
  },
  {
    src: "spikes/showreel/out/leela-launch.mp4",
    out: "public/films/launch.mp4",
    text: "This is the launch. Any idea, at play. Three ways in: an explainer, a code lab, and a story. The model writes the plan. You approve it. Code renders the film.",
  },
  {
    src: "spikes/showreel/out/wedding-home.mp4",
    out: "public/films/wedding.mp4",
    text: "The Wedding Home keeps the whole wedding in one house. Mehendi, the baraat, and the wedding day sit on one board. A guest opens a link. No account. One list for the whole family.",
  },
  {
    src: "spikes/showreel/out/guest-list.mp4",
    out: "public/films/guests.mp4",
    text: "The problem is a long guest list, and we want one name. We do not read every row. Aisha, Dev, Farah, Kabir, then Meera, Neel, Riya, Zoya. Cut the list in half. The name is found.",
  },
];

function seconds(file: string): number {
  const raw = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return Number(raw.trim());
}

const env = loadEnv();
if (!env.elevenLabsApiKey) {
  console.error("ELEVENLABS_API_KEY is missing");
  process.exit(1);
}
const voice = pickVoice(await listVoices(env.elevenLabsApiKey));
console.log("voice", voice.name);

for (const film of films) {
  const take = await synthesize({ apiKey: env.elevenLabsApiKey, voiceId: voice.id, text: film.text });
  const mp3 = resolve("/tmp", `leela-one-${film.out.split("/").pop()}.mp3`);
  writeFileSync(mp3, take.audio);
  const video = seconds(resolve(film.src));
  const audio = seconds(mp3);
  const out = resolve(film.out);
  if (audio > video - 0.15) {
    const ratio = (audio / video).toFixed(4);
    execFileSync("ffmpeg", [
      "-y", "-i", resolve(film.src), "-i", mp3,
      "-filter:v", `setpts=${ratio}*PTS`,
      "-map", "0:v", "-map", "1:a",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
      "-c:a", "aac", "-shortest", out,
    ], { stdio: "inherit" });
  } else {
    execFileSync("ffmpeg", [
      "-y", "-i", resolve(film.src), "-i", mp3,
      "-filter_complex", "[1:a]apad[a]",
      "-map", "0:v", "-map", "[a]",
      "-c:v", "copy", "-c:a", "aac", "-shortest", out,
    ], { stdio: "inherit" });
  }
  console.log("one voice", film.out, "video", video.toFixed(1), "audio", audio.toFixed(1));
}
