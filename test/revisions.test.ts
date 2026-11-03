import test from 'node:test';
import assert from 'node:assert/strict';
import type { Plan } from '../src/contracts/plan.js';
import { slowScenes } from '../src/modules/revisions/slow.js';

test('scene-targeted holds preserve every other scene and report actual changes', () => {
  const plan = { scenes: [{ id: 's1', holdMs: 100 }, { id: 's2', holdMs: 200 }, { id: 's3', holdMs: 1200 }] } as Plan;
  const result = slowScenes(plan, ['s2', 's3']);
  assert.equal(result.plan.scenes[0], plan.scenes[0]);
  assert.equal(result.plan.scenes[1].holdMs, 440);
  assert.deepEqual(result.changedSceneIds, ['s2']);
  assert.equal(plan.scenes[1].holdMs, 200);
  assert.throws(() => slowScenes(plan, ['missing']));
});
