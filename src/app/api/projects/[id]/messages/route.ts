import { Draft, Message } from "../../../../../server/db";
import { apiError } from "../../../../../server/http";
import { authed, busy, json } from "../../../../../server/guard";
import { ownProject, startJob } from "../../../../../server/studio";

export const maxDuration = 60;

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed();
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  const project = await ownProject(auth.user!._id, id);
  if (!project) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  const items = await Message.find({ projectId: project._id, ownerId: auth.user!._id }).sort({ seq: 1 }).limit(40);
  return json({
    items: items.map((item) => ({
      id: String(item._id),
      seq: item.seq,
      role: item.role,
      text: item.text,
      sceneIds: item.sceneIds,
      candidate: item.candidate ? { summary: item.candidate.summary, changedSceneIds: item.candidate.changedSceneIds, changeClass: item.candidate.changeClass, status: item.candidate.status } : undefined,
    })),
  });
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authed(request);
  if ("error" in auth && auth.error) return auth.error;
  const { id } = await ctx.params;
  const project = await ownProject(auth.user!._id, id);
  if (!project) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  const body = (await request.json().catch(() => null)) as { text?: string; sceneIds?: string[] } | null;
  const text = body?.text?.trim() ?? "";
  if (!text) return apiError(400, "VALIDATION", "VALIDATION", "Write a note for the copilot.");
  const draft = await Draft.findOne({ projectId: project._id, ownerId: auth.user!._id });
  if (!draft) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  const updated = await Draft.findOneAndUpdate({ _id: draft._id, ownerId: auth.user!._id }, { $inc: { messageSeq: 1 } }, { new: true });
  if (!updated) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
  const seq = updated.messageSeq;
  const userMessage = await Message.create({
    ownerId: auth.user!._id,
    projectId: project._id,
    seq,
    role: "user",
    text: text.slice(0, 4000),
    sceneIds: body?.sceneIds ?? [],
  });
  try {
    const job = await startJob({
      ownerId: auth.user!._id,
      projectId: project._id,
      type: "revise",
      input: { text, messageId: userMessage._id, sceneIds: Array.isArray(body?.sceneIds) ? body.sceneIds.filter((id): id is string => typeof id === "string").slice(0, 40) : [] },
      stages: [{ name: "revise", state: "running" }],
    });
    const candidate = job?.result?.candidate;
    const after = await Draft.findOneAndUpdate({ _id: draft._id, ownerId: auth.user!._id }, { $inc: { messageSeq: 1 } }, { new: true });
    if (!after) return apiError(404, "NOT_FOUND", "NOT_FOUND", "That project is not here.");
    const assistant = await Message.create({
      ownerId: auth.user!._id,
      projectId: project._id,
      seq: after.messageSeq,
      role: "assistant",
      text: candidate?.summary || job?.error?.message || "I could not make that change.",
      jobId: job?._id,
      candidate,
    });
    return json({ message: { id: String(assistant._id) }, jobId: String(job?._id) }, 202);
  } catch (error) {
    return busy(error) ?? apiError(500, "FAILED", "FAILED", error instanceof Error ? error.message : "The copilot failed.");
  }
}
