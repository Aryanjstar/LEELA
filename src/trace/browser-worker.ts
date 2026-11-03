import { traceProgram } from "./interpret";

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ result: traceProgram(data.code, data.entry, data.input) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Trace failed." });
  }
};
