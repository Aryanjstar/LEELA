# S3 Code trace

**Date:** 2026-10-19

## What was tried

`spikes/s3-trace/leela_tracer.py` traces one call with `sys.settrace` and writes the trace JSON from ARCHITECTURE §8.2. Imports are disabled. The server only reads the JSON.

Checked on this machine:

- `fib(4)` makes 9 calls, in order `4, 3, 2, 1, 0, 1, 2, 1, 0`
- `binary_search([1, 3, 5, 7, 9], 7)` returns index 3
- `import os` fails with imports disabled

## Not done

This is CPython on the machine, not Pyodide inside a browser Web Worker. The worker host is still layer 3. The spike does not pass until that host runs the same tracer.

## Decision

Keep this tracer. Load it with Pyodide in the browser worker before Code Lab. Do not run user code on the server.
