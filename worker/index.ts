import mongoose from "mongoose";
import { connectDb } from "../src/server/db";
import { processPreview } from "./preview";

let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });
await connectDb();
console.log("SceneSpindle preview worker started");
while (!stopping) {
  try {
    if (!await processPreview()) await new Promise(resolve => setTimeout(resolve, 500));
  } catch {
    console.error("Preview worker temporarily unavailable");
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
await mongoose.disconnect();
