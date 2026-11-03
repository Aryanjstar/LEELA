import test from 'node:test';
import assert from 'node:assert/strict';
import { groupCaptions } from '../src/cli/captions.js';

test('caption groups retain timing and text and end at punctuation or long pauses', () => {
  const words = [{ text: 'Hello,', startMs: 0, endMs: 300 }, { text: 'world!', startMs: 320, endMs: 600 }, { text: 'Again', startMs: 1500, endMs: 1800 }];
  const captions = groupCaptions(words, 3);
  assert.deepEqual(captions.map(c => [c.text, c.startMs, c.endMs]), [['Hello, world!', 0, 600], ['Again', 1500, 1800]]);
  assert.deepEqual(captions.flatMap(c => c.words), words);
});
test('rejects invalid, overlapping, or fabricated timings and invalid limits', () => {
  assert.throws(() => groupCaptions([{ text: 'x', startMs: 1, endMs: 1 }]));
  assert.throws(() => groupCaptions([{ text: 'x', startMs: 0, endMs: 20 }, { text: 'y', startMs: 10, endMs: 30 }]));
  assert.throws(() => groupCaptions([], 0));
  assert.throws(() => groupCaptions(null));
});
