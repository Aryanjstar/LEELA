import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Asset } from "../../../../server/db";
import { apiError } from "../../../../server/http";
import { authed, json } from "../../../../server/guard";

const SYSTEM = [
  { id: "moon", name: "Spinning Mystery", kind: "video", licence: "produced-by-leela", source: "system" },
  { id: "code", name: "Find 21", kind: "video", licence: "produced-by-leela", source: "system" },
  { id: "story", name: "Ek lattu", kind: "video", licence: "produced-by-leela", source: "system" },
];

export async function GET() {
  const auth = await authed();
  if ("error" in auth && auth.error) return auth.error;
  const mine = await Asset.find({ ownerId: auth.user!._id }).sort({ createdAt: -1 }).limit(40);
  return json({
    items: [
      ...SYSTEM,
      ...mine.map((item) => ({ id: String(item._id), name: item.name, kind: item.kind, licence: item.licence, source: item.source })),
    ],
  });
}

export async function POST(request: Request) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return apiError(400, "VALIDATION", "VALIDATION", "Choose a file.");
  if (file.size > 8_000_000) return apiError(413, "VALIDATION", "PAYLOAD_TOO_LARGE", "Files stay under 8 MB.");
  const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : "";
  if (!kind) return apiError(400, "VALIDATION", "VALIDATION", "Use an image, audio, or video file.");
  const dir = resolve(process.cwd(), ".data", "uploads", String(auth.user!._id));
  mkdirSync(dir, { recursive: true });
  const safe = file.name.replace(/[^\w.-]+/g, "-").slice(0, 80);
  const path = resolve(dir, `${Date.now()}-${safe}`);
  writeFileSync(path, Buffer.from(await file.arrayBuffer()));
  const asset = await Asset.create({
    ownerId: auth.user!._id,
    kind,
    name: file.name.slice(0, 120),
    path,
    mime: file.type,
    licence: "own-upload",
    source: "mine",
  });
  return json({ asset: { id: String(asset._id), name: asset.name, kind: asset.kind, licence: asset.licence } }, 201);
}
