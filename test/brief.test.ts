import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compileBriefPrompts, refineBrief } from '../src/brief/contract';

const project = { projectId: 'example', mode: 'explainer', format: '9x16', language: 'hi', targetMs: 30000 };
test('sparse request asks one meaningful direction question without making up audience or facts', () => {
  const brief = refineBrief({ rawRequest: 'Explain why the moon stays in orbit' }, project);
  assert.equal(brief.state, 'needs_input');
  assert.equal(brief.questions.length, 1);
  assert.equal(brief.audience, null);
  assert.equal(brief.provenance.objective, 'inferred');
  assert.equal(brief.research.status, 'not_performed');
  assert.throws(() => compileBriefPrompts(brief), /BRIEF_INCOMPLETE/);
});
test('approved direction preserves exact script and source constraints in every task', () => {
  const script = 'यह मेरी असली कहानी है।';
  const brief = refineBrief({ rawRequest: 'Make my story into a short video', exactScript: script, mustAvoid: ['invented statistics'], directionId: 'story' }, project);
  assert.equal(brief.state, 'ready_for_review');
  assert.deepEqual(brief.questions, []);
  const prompts = compileBriefPrompts(brief);
  assert.equal(prompts.script.exactScript, script);
  assert.equal(prompts.storyboard.exactScript, script);
  assert.equal(prompts.qa.exactScript, script);
  assert.deepEqual(prompts.script.mustAvoid, ['invented statistics']);
  assert.equal(refineBrief({ rawRequest: 'Make my story into a short video', exactScript: script, mustAvoid: ['invented statistics'], directionId: 'story' }, project).contentHash, brief.contentHash);
});
test('invalid or unexpected brief fields are rejected', () => {
  assert.throws(() => refineBrief({ rawRequest: 'short', executeShell: true }, project));
  assert.throws(() => refineBrief({ rawRequest: 'Make a video about this', directionId: 'unsupported' }, project));
});
