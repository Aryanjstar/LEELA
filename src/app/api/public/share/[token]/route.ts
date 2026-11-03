import { apiError } from "../../../../../server/http";

// The current renderer produces HTML previews only. Public sharing is enabled
// once an artifact-serving path and verified MP4 QA are implemented.
export async function GET() {
  return apiError(404, "NOT_FOUND", "NOT_FOUND", "That video is not available.");
}
