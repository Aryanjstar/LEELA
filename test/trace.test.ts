import assert from "node:assert/strict";
import test from "node:test";
import { traceProgram } from "../src/trace/interpret";

const fib = `def fib(n):
  if n <= 1:
    return n
  return fib(n - 1) + fib(n - 2)
`;

const search = `def binary_search(arr, target):
  lo = 0
  hi = len(arr) - 1
  while lo <= hi:
    mid = (lo + hi) // 2
    if arr[mid] == target:
      return mid
    if arr[mid] < target:
      lo = mid + 1
    else:
      hi = mid - 1
  return -1
`;

test("fib(4) returns 3", () => {
  const traced = traceProgram(fib, "fib", [4]);
  assert.equal(traced.returned, 3);
  assert.ok(traced.summary.callCount > 1);
});

test("binary search finds 21", () => {
  const traced = traceProgram(search, "binary_search", [[4, 9, 15, 21, 28, 33], 21]);
  assert.equal(traced.returned, 3);
  assert.ok(traced.steps.length < 2000);
});

test("import is refused", () => {
  assert.throws(() => traceProgram("import os\ndef f():\n  return 1\n", "f", []), /not allowed/);
});

test("a loop stops at the cap", () => {
  const source = "def spin():\n  n = 0\n  while n >= 0:\n    n = n + 1\n  return n\n";
  assert.throws(() => traceProgram(source, "spin", []), /2,000/);
});
