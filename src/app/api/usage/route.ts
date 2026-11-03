import { authed, json } from "../../../server/guard";
import { loadEnv } from "../../../config/env";

export async function GET() {
  const auth = await authed();
  if ("error" in auth && auth.error) return auth.error;
  const env = loadEnv();
  // Configuration is not a measurement of provider usage, credit, or allowance.
  return json({
    providers: [
      { id: "gemini", label: "Planner", configured: Boolean(env.geminiApiKey), used: null, limit: null },
      { id: "elevenlabs", label: "Voice", configured: Boolean(env.elevenLabsApiKey), used: null, limit: null },
      { id: "sarvam", label: "Sarvam", configured: Boolean(env.sarvamApiKey), used: null, limit: null },
    ],
    measured: false,
  });
}
