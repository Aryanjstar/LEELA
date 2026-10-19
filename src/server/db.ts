import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { appEnv } from "../config/app";

type DbCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalCache = globalThis as unknown as { __leelaDb?: DbCache };

function cache(): DbCache {
  globalCache.__leelaDb ??= { conn: null, promise: null };
  return globalCache.__leelaDb;
}

export async function connectDb() {
  const env = appEnv();
  if (!env.mongoUri) throw new Error("MONGODB_URI is not set");
  const cached = cache();
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;
  if (mongoose.connection.readyState !== 1) {
    cached.conn = null;
  }
  if (!cached.promise) {
    mongoose.set("bufferTimeoutMS", 5_000);
    cached.promise = mongoose.connect(env.mongoUri, {
      dbName: env.mongoDb,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 5_000,
      socketTimeoutMS: 8_000,
    });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    const message = error instanceof Error ? error.message : "";
    const kind = /whitelist/i.test(message)
      ? "whitelist"
      : /bad auth|authentication failed/i.test(message)
        ? "auth"
        : /ENOTFOUND|getaddrinfo/i.test(message)
          ? "dns"
          : /timed out|server selection/i.test(message)
            ? "timeout"
            : "other";
    console.error("leela-db", kind);
    throw error;
  }
}

const prefs = {
  defaultMode: { type: String, default: "explainer" },
  defaultFormat: { type: String, default: "9x16" },
  defaultTargetMs: { type: Number, default: 45000 },
  defaultLanguage: { type: String, default: "en" },
  defaultVoiceId: { type: String, default: "elevenlabs:alice" },
  defaultStyleId: { type: String, default: "chalk-and-chai@1" },
  timezone: { type: String, default: "Asia/Kolkata" },
  glass: { type: String, default: "tinted" },
  reducedMotion: { type: Boolean, default: false },
  funCopy: { type: Boolean, default: true },
  uiSound: { type: Boolean, default: false },
};

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true, maxlength: 120 },
    passwordHash: { type: String, required: true },
    passwordChangedAt: { type: Date, required: true },
    prefs: { type: new Schema(prefs, { _id: false }), default: () => ({}) },
    pronunciations: { type: [{ written: String, spoken: String }], default: [] },
  },
  { timestamps: true },
);

const sessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  lastSeenAt: { type: Date, required: true },
  userAgent: { type: String, maxlength: 200 },
});

const projectSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, maxlength: 120 },
    mode: { type: String, required: true, enum: ["explainer", "code_lab", "story", "audio", "cartoon", "montage"] },
    format: { type: String, required: true, enum: ["9x16", "16x9", "1x1"] },
    targetMs: { type: Number, required: true },
    language: { type: String, required: true, enum: ["en", "hi", "hinglish"] },
    voiceId: { type: String, required: true },
    styleId: { type: String, required: true },
    keepPrivate: { type: Boolean, required: true, default: false },
    badge: { type: String, required: true, enum: ["draft", "planning", "review", "rendering", "ready", "failed"], default: "draft" },
  },
  { timestamps: true },
);

const draftSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true },
    projectId: { type: Schema.Types.ObjectId, required: true, unique: true },
    revision: { type: Number, required: true, default: 1 },
    idea: {
      topic: { type: String, default: "" },
      audience: String,
      notes: String,
      mustInclude: { type: [String], default: [] },
    },
    plan: { type: Schema.Types.Mixed },
    planHash: { type: String },
    planValid: { type: Boolean, required: true, default: false },
    traceId: { type: Schema.Types.ObjectId },
    messageSeq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

const jobSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true, enum: ["brainstorm", "plan", "revise", "scene_regen", "render", "image", "cleanup", "publish"] },
    state: { type: String, required: true, enum: ["queued", "running", "waiting_quota", "succeeded", "failed", "cancelled"], default: "queued" },
    activeSlot: { type: Boolean },
    input: { type: Schema.Types.Mixed, required: true },
    stages: { type: [Schema.Types.Mixed], default: [] },
    progress: Number,
    attempts: { type: Number, required: true, default: 0 },
    maxAttempts: { type: Number, required: true, default: 3 },
    runAfter: { type: Date, required: true },
    error: { type: Schema.Types.Mixed },
    result: { type: Schema.Types.Mixed },
    finishedAt: Date,
  },
  { timestamps: true },
);

const storyboardSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true },
    projectId: { type: Schema.Types.ObjectId, required: true },
    version: { type: Number, required: true },
    schemaVersion: { type: Number, required: true },
    plan: { type: Schema.Types.Mixed, required: true },
    planHash: { type: String, required: true },
    storyHash: { type: String, required: true },
    traceId: Schema.Types.ObjectId,
    origin: { type: String, required: true, enum: ["approve", "revision", "restore"] },
    plannerModel: String,
    approvedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

const videoSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true },
    projectId: { type: Schema.Types.ObjectId, required: true },
    storyboardId: { type: Schema.Types.ObjectId, required: true },
    version: { type: Number, required: true },
    format: { type: String, required: true },
    state: { type: String, required: true, enum: ["building", "ready", "failed"], default: "building" },
    jobId: { type: Schema.Types.ObjectId, required: true },
    durationMs: Number,
    warnings: { type: [String], default: [] },
    previewHtml: String,
    audioPath: String,
    mp4Path: String,
    commercialSafe: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const shareSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true },
    projectId: { type: Schema.Types.ObjectId, required: true },
    videoId: { type: Schema.Types.ObjectId, required: true },
    token: { type: String, required: true, unique: true },
    allowDownload: { type: Boolean, required: true, default: false },
    revokedAt: Date,
    views: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

const messageSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true },
    projectId: { type: Schema.Types.ObjectId, required: true },
    seq: { type: Number, required: true },
    role: { type: String, required: true, enum: ["user", "assistant", "note"] },
    text: { type: String, required: true, maxlength: 4000 },
    sceneIds: { type: [String], default: [] },
    jobId: Schema.Types.ObjectId,
    candidate: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

const traceSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true },
    projectId: { type: Schema.Types.ObjectId, required: true },
    language: { type: String, required: true },
    entry: { type: String, required: true },
    input: { type: Schema.Types.Mixed, required: true },
    summary: { type: Schema.Types.Mixed, required: true },
    tracerVersion: { type: String, required: true },
    steps: { type: [Schema.Types.Mixed], required: true },
  },
  { timestamps: true },
);

const characterSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, maxlength: 40 },
    description: { type: String, default: "", maxlength: 280 },
    style: { type: String, required: true, enum: ["flat", "cartoon", "storybook", "clay"], default: "cartoon" },
    voiceId: { type: String, default: "" },
  },
  { timestamps: true },
);

const assetSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    kind: { type: String, required: true, enum: ["image", "audio", "video"] },
    name: { type: String, required: true, maxlength: 120 },
    path: { type: String, required: true },
    mime: { type: String, required: true },
    licence: { type: String, required: true },
    source: { type: String, required: true, enum: ["system", "mine"], default: "mine" },
  },
  { timestamps: true },
);

const connectionSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    provider: { type: String, required: true, enum: ["youtube", "instagram"] },
    label: { type: String, default: "" },
    status: { type: String, required: true, enum: ["pending", "connected"], default: "pending" },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
export const Draft = mongoose.models.Draft || mongoose.model("Draft", draftSchema);
export const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
export const Storyboard = mongoose.models.Storyboard || mongoose.model("Storyboard", storyboardSchema);
export const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);
export const ShareLink = mongoose.models.ShareLink || mongoose.model("ShareLink", shareSchema);
export const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
export const Trace = mongoose.models.Trace || mongoose.model("Trace", traceSchema);
export const Character = mongoose.models.Character || mongoose.model("Character", characterSchema);
export const Asset = mongoose.models.Asset || mongoose.model("Asset", assetSchema);
export const Connection = mongoose.models.Connection || mongoose.model("Connection", connectionSchema);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };
