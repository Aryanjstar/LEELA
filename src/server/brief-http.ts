import { ZodError } from 'zod';
import { apiError } from './http';
import { BriefConflict, BriefIncomplete } from './briefs';

export function briefError(error: unknown) {
  if (error instanceof BriefConflict) return apiError(409, 'CONFLICT', 'REVISION_CONFLICT', 'This brief changed elsewhere.', { currentRevision: error.currentRevision });
  if (error instanceof BriefIncomplete) return apiError(422, 'VALIDATION', 'BRIEF_INCOMPLETE', 'Choose a direction before approving the brief.');
  if (error instanceof ZodError) return apiError(400, 'VALIDATION', 'INVALID_BRIEF', 'Check the brief fields.', { issues: error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })) });
  return apiError(503, 'UNAVAILABLE', 'BRIEF_FAILED', 'The brief could not be saved right now.');
}
