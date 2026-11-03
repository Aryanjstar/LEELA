import { createHash } from 'node:crypto';
import { z } from 'zod';

export const briefInputSchema = z.object({
  rawRequest: z.string().trim().min(8).max(20_000),
  objective: z.string().trim().min(3).max(2000).optional(),
  audience: z.string().trim().max(200).optional(),
  exactScript: z.string().max(30_000).optional(),
  mustInclude: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  mustAvoid: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  directionId: z.enum(['clear', 'story', 'visual']).optional(),
  researchMode: z.enum(['off', 'auto', 'requested']).default('auto'),
}).strict();
export type BriefInput = z.infer<typeof briefInputSchema>;

export const briefAnswerSchema = z.object({
  expectedRevision: z.number().int().positive(),
  decisionId: z.literal('direction'),
  choice: z.enum(['clear', 'story', 'visual']),
}).strict();

export const briefContextSchema = z.object({
  projectId: z.string().min(1),
  mode: z.string().min(1),
  format: z.string().min(1),
  language: z.string().min(1),
  targetMs: z.number().int().positive(),
  inheritedAudience: z.string().optional(),
}).strict();

export type BriefContext = {
  projectId: string;
  mode: string;
  format: string;
  language: string;
  targetMs: number;
  inheritedAudience?: string;
};
export type Direction = { id: 'clear' | 'story' | 'visual'; title: string; approach: string; tradeoff: string };
export type BriefResult = {
  schemaVersion: 1;
  rawRequest: string;
  objective: string;
  audience: string | null;
  exactScript: string | null;
  mustInclude: string[];
  mustAvoid: string[];
  project: BriefContext;
  provenance: { objective: 'user' | 'inferred'; audience: 'user' | 'inherited' | 'missing'; format: 'project'; language: 'project'; targetMs: 'project' };
  directions: Direction[];
  selectedDirectionId: Direction['id'] | null;
  questions: { id: 'direction'; prompt: string; options: Direction['id'][] }[];
  assumptions: string[];
  research: { mode: BriefInput['researchMode']; status: 'not_performed'; note: string };
  state: 'needs_input' | 'ready_for_review';
  contentHash: string;
};

const directions: Direction[] = [
  { id: 'clear', title: 'Clear explanation', approach: 'Lead with the central idea, then show a concrete example and takeaway.', tradeoff: 'Fast to understand; less narrative build.' },
  { id: 'story', title: 'Story led', approach: 'Open in a specific moment, develop the tension, then resolve it.', tradeoff: 'More emotional context; needs careful pacing.' },
  { id: 'visual', title: 'Visual first', approach: 'Open with the strongest available image or motion and let the words support it.', tradeoff: 'Strong opening; depends on suitable visuals.' },
];

export function hashBrief(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function refineBrief(input: unknown, context: BriefContext): BriefResult {
  const data = briefInputSchema.parse(input);
  const audience = data.audience?.trim() || context.inheritedAudience?.trim() || null;
  const selectedDirectionId = data.directionId ?? null;
  const objective = data.objective?.trim() || data.rawRequest;
  const assumptions = [];
  if (!audience) assumptions.push('Audience is unspecified; confirm it before a final script or publishable factual claim.');
  const core = {
    schemaVersion: 1 as const,
    rawRequest: data.rawRequest,
    objective,
    audience,
    exactScript: data.exactScript || null,
    mustInclude: data.mustInclude,
    mustAvoid: data.mustAvoid,
    project: context,
    provenance: {
      objective: data.objective ? 'user' as const : 'inferred' as const,
      audience: data.audience ? 'user' as const : context.inheritedAudience ? 'inherited' as const : 'missing' as const,
      format: 'project' as const,
      language: 'project' as const,
      targetMs: 'project' as const,
    },
    directions,
    selectedDirectionId,
    questions: selectedDirectionId ? [] : [{ id: 'direction' as const, prompt: 'Which direction fits this video?', options: directions.map(d => d.id) }],
    assumptions,
    research: { mode: data.researchMode, status: 'not_performed' as const, note: 'External research has not been run. Check time-sensitive facts before production.' },
    state: selectedDirectionId ? 'ready_for_review' as const : 'needs_input' as const,
  };
  return { ...core, contentHash: hashBrief(core) };
}

export function compileBriefPrompts(brief: BriefResult) {
  if (brief.state !== 'ready_for_review' || !brief.selectedDirectionId) throw new Error('BRIEF_INCOMPLETE');
  const direction = directions.find(item => item.id === brief.selectedDirectionId)!;
  const shared = {
    objective: brief.objective,
    audience: brief.audience,
    mode: brief.project.mode,
    format: brief.project.format,
    language: brief.project.language,
    targetMs: brief.project.targetMs,
    mustInclude: brief.mustInclude,
    mustAvoid: brief.mustAvoid,
    direction: direction.approach,
    exactScript: brief.exactScript,
    constraints: ['Preserve supplied facts and names.', 'Do not invent metrics or credentials.', 'Use registered components and validated assets only.'],
  };
  return { templateVersion: 'brief-v1', briefHash: brief.contentHash, script: { ...shared, task: brief.exactScript ? 'Preserve the exact script and plan its delivery.' : 'Draft a reviewable script.' }, storyboard: { ...shared, task: 'Create a scene outline with motivated visuals and measurable cues.' }, qa: { ...shared, task: 'Review factual claims, text readability, timing, safe zones and audible mix.' } };
}
