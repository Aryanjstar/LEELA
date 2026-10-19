#!/usr/bin/env python3
"""Trace one Python call into Leela's trace JSON. Imports and file access are blocked."""

import json
import sys

SAFE_BUILTINS = {
    "len": len,
    "range": range,
    "int": int,
    "bool": bool,
    "float": float,
    "str": str,
    "list": list,
    "dict": dict,
    "tuple": tuple,
    "min": min,
    "max": max,
    "abs": abs,
    "sum": sum,
    "enumerate": enumerate,
    "zip": zip,
    "reversed": reversed,
    "isinstance": isinstance,
    "ValueError": ValueError,
    "IndexError": IndexError,
    "StopIteration": StopIteration,
    "Exception": Exception,
    "True": True,
    "False": False,
    "None": None,
}


def _blocked_import(name, *args, **kwargs):
    raise ImportError("imports are disabled")


def encode(value, depth=0):
    if value is None:
        return {"t": "none", "v": None}
    if isinstance(value, bool):
        return {"t": "bool", "v": value}
    if isinstance(value, int) and not isinstance(value, bool):
        return {"t": "int", "v": value}
    if isinstance(value, float):
        return {"t": "float", "v": value}
    if isinstance(value, str):
        return {"t": "str", "v": value[:200]}
    if isinstance(value, (list, tuple)) and depth < 4:
        items = [encode(item, depth + 1) for item in list(value)[:64]]
        out = {"t": "list" if isinstance(value, list) else "tuple", "items": items}
        if len(value) > 64:
            out["more"] = len(value) - 64
        return out
    if isinstance(value, dict) and depth < 4:
        entries = []
        for index, (key, item) in enumerate(value.items()):
            if index >= 32:
                break
            entries.append([encode(key, depth + 1), encode(item, depth + 1)])
        out = {"t": "dict", "entries": entries}
        if len(value) > 32:
            out["more"] = len(value) - 32
        return out
    return {"t": "other", "repr": repr(value)[:200]}


def trace_call(source, entry, argument):
    globs = {"__builtins__": {**SAFE_BUILTINS, "__import__": _blocked_import}, "__name__": "traced"}
    code = compile(source, "<traced>", "exec")
    exec(code, globs)
    if entry not in globs or not callable(globs[entry]):
        raise ValueError(f"entry {entry} is not a function")
    fn = globs[entry]
    steps = []
    frame_ids = {}
    next_id = 1
    truncated = False

    def fid(frame):
        nonlocal next_id
        key = id(frame)
        if key not in frame_ids:
            frame_ids[key] = next_id
            next_id += 1
        return frame_ids[key]

    def tracer(frame, event, arg):
        nonlocal truncated
        if frame.f_code.co_filename != "<traced>" or frame.f_code.co_name == "<module>":
            return tracer
        if event not in ("call", "line", "return", "exception"):
            return tracer
        if len(steps) >= 2000:
            truncated = True
            raise RuntimeError("step cap")
        chain = []
        cursor = frame
        while cursor is not None:
            if cursor.f_code.co_filename == "<traced>" and cursor.f_code.co_name != "<module>":
                chain.append(cursor)
            cursor = cursor.f_back
        chain.reverse()
        frames = []
        for index, item in enumerate(chain):
            frames.append({
                "id": fid(item),
                "fn": item.f_code.co_name,
                **({"parentId": frames[index - 1]["id"]} if index else {}),
                "locals": {key: encode(value) for key, value in item.f_locals.items() if not key.startswith("_")},
            })
        step = {"i": len(steps), "line": frame.f_lineno, "event": event, "frames": frames}
        if event == "return":
            step["ret"] = encode(arg)
        steps.append(step)
        return tracer

    sys.settrace(tracer)
    try:
        if isinstance(argument, list):
            fn(*argument)
        else:
            fn(argument)
    finally:
        sys.settrace(None)

    return {
        "version": 1,
        "language": "python",
        "entry": entry,
        "input": argument,
        "steps": steps,
        "truncated": truncated,
    }


def main():
    request = json.load(sys.stdin)
    result = trace_call(request["source"], request["entry"], request["input"])
    json.dump(result, sys.stdout)


if __name__ == "__main__":
    main()
