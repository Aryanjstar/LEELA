import { authed, json } from "../../../server/guard";
import { loadEnv } from "../../../config/env";

export async function GET() {
  const auth = await authed();
  if ("error" in auth && auth.error) return auth.error;
  const env = loadEnv();
  const day = new Date();
  day.setUTCHours(24, 0, 0, 0);
  return json({
    providers: [
      { id: "gemini", label: "Planner", unit: "calls", period: "day", used: 0, limit: env.geminiApiKey ? 1500 : 0, resetsAt: day.toISOString(), seesContent: true, trainsOnFreeTier: true },
      { id: "elevenlabs", label: "Voice", unit: "characters", period: "month", used: 0, limit: env.elevenLabsApiKey ? 10000 : 0, resetsAt: day.toISOString(), seesContent: true, trainsOnFreeTier: true },
      { id: "sarvam", label: "Sarvam", unit: "characters", period: "month", used: 0, limit: env.sarvamApiKey ? 10000 : 0, resetsAt: day.toISOString(), seesContent: true, trainsOnFreeTier: false },
    ],
  });
}
