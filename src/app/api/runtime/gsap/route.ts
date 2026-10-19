import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export async function GET() {
  const body = readFileSync(resolve(process.cwd(), "node_modules/gsap/dist/gsap.min.js"));
  return new Response(body, {
    headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "public, max-age=86400" },
  });
}
