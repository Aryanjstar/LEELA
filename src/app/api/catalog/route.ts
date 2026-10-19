import { json } from "../../../server/guard";

export async function GET() {
  return json({
    modes: [
      { id: "explainer", label: "Explainer", available: true },
      { id: "code_lab", label: "Code Lab", available: true },
      { id: "story", label: "Story", available: true },
      { id: "audio", label: "Audio", available: true },
      { id: "cartoon", label: "Cartoon", available: true },
      { id: "montage", label: "Montage", available: true },
    ],
    formats: ["9x16", "16x9", "1x1"],
    targets: [15000, 30000, 45000, 60000, 90000, 120000, 180000],
    languages: [
      { id: "en", label: "English", available: true },
      { id: "hi", label: "Hindi", available: true },
      { id: "hinglish", label: "Hinglish", available: true },
    ],
    voices: [{ id: "elevenlabs:alice", label: "Alice", language: "en", provider: "elevenlabs", free: true }],
    styles: [{ id: "chalk-and-chai@1", label: "Chalk & Chai", modes: ["explainer", "story", "cartoon"] }],
  });
}
