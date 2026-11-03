import test from 'node:test';
import assert from 'node:assert/strict';
import { originOk } from '../src/server/http.js';

test('mutation origins must match configured origin, regardless of forwarded host', () => {
  const previous = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = 'https://studio.example';
  try {
    assert.equal(originOk(new Request('https://studio.example/api', { headers: { origin: 'https://studio.example' } })), true);
    assert.equal(originOk(new Request('https://studio.example/api', { headers: { origin: 'https://attacker.example', 'x-forwarded-host': 'attacker.example' } })), false);
    assert.equal(originOk(new Request('https://studio.example/api')), false);
  } finally { if (previous === undefined) delete process.env.APP_ORIGIN; else process.env.APP_ORIGIN = previous; }
});
