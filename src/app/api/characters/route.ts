import { Character } from "../../../server/db";
import { apiError } from "../../../server/http";
import { authed, json } from "../../../server/guard";
import { characterAllowed } from "../../../server/studio";

export async function GET() {
  const auth = await authed();
  if ("error" in auth && auth.error) return auth.error;
  const items = await Character.find({ ownerId: auth.user!._id }).sort({ updatedAt: -1 }).limit(40);
  return json({ items: items.map((item) => ({ id: String(item._id), name: item.name, description: item.description, style: item.style })) });
}

export async function POST(request: Request) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const body = (await request.json().catch(() => null)) as { name?: string; description?: string; style?: string } | null;
  const name = body?.name?.trim() ?? "";
  if (name.length < 2) return apiError(400, "VALIDATION", "VALIDATION", "A character needs a name.");
  const blocked = characterAllowed(name);
  if (blocked) return apiError(422, "VALIDATION", "PROTECTED_CHARACTER", "That character is not allowed.");
  const taken = await Character.findOne({ ownerId: auth.user!._id, name });
  if (taken) return apiError(409, "CONFLICT", "CHARACTER_NAME_TAKEN", "You already have a character with that name.");
  const style = ["flat", "cartoon", "storybook", "clay"].includes(body?.style || "") ? body?.style : "cartoon";
  const character = await Character.create({
    ownerId: auth.user!._id,
    name: name.slice(0, 40),
    description: (body?.description || "").slice(0, 280),
    style,
  });
  return json({ character: { id: String(character._id), name: character.name, style: character.style } }, 201);
}
