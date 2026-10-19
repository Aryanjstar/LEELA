import { readFileSync } from "node:fs";
import { config, higgsfield } from "@higgsfield/client/v2";

function loadCredentials() {
  if (process.env.HF_CREDENTIALS) return;
  const text = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    if (!line.startsWith("HF_CREDENTIALS=")) continue;
    process.env.HF_CREDENTIALS = line.slice("HF_CREDENTIALS=".length).trim();
  }
}

loadCredentials();
if (!process.env.HF_CREDENTIALS) {
  console.error("HF_CREDENTIALS is missing");
  process.exit(1);
}

config({ credentials: process.env.HF_CREDENTIALS });

let result;
try {
  result = await higgsfield.subscribe("bytedance/seedance-2.5/text-to-video", {
    input: {
      prompt: "A cinematic scene at sunset",
      duration: 5,
      resolution: "720p",
      aspect_ratio: "16:9",
      output_format: "mp4",
      generate_audio: true,
    },
    withPolling: true,
  });
} catch (error) {
  const name = error instanceof Error ? error.name : "failed";
  console.error(name === "NotEnoughCreditsError" ? "not enough credits" : name);
  process.exit(1);
}

const status = result.status;
if (status === "completed") {
  const url = result.video?.url;
  if (!url) {
    console.error("completed without a video url");
    process.exit(1);
  }
  console.log(url);
  process.exit(0);
}

console.error(status || "failed");
process.exit(1);
