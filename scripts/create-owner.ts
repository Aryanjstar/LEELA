import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
  const i = trimmed.indexOf("=");
  process.env[trimmed.slice(0, i)] = trimmed.slice(i + 1);
}

const { connectDb, User } = await import("../src/server/db.js");
const { hashPassword } = await import("../src/server/session.js");

const email = (process.env.OWNER_EMAIL || "").toLowerCase();
if (!email) throw new Error("OWNER_EMAIL is not set");
await connectDb();
const existing = await User.findOne({ email });
if (existing) {
  console.log("owner already exists");
  process.exit(0);
}
const password = `Leela-${randomBytes(9).toString("base64url")}`;
await User.create({
  email,
  name: "Aryan",
  passwordHash: await hashPassword(password),
  passwordChangedAt: new Date(),
});
mkdirSync(".data", { recursive: true });
writeFileSync(resolve(".data/owner-password.txt"), `${email}\n${password}\n`, { mode: 0o600 });
console.log("owner created. password file: .data/owner-password.txt");
process.exit(0);
