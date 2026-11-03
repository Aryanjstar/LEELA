import { apiError } from "../../../../../../server/http";

export async function GET() {
  return apiError(404, "NOT_FOUND", "NOT_FOUND", "That video is not available.");
}
