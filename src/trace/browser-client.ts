import type { traceProgram } from "./interpret";

export function runBrowserTrace(...[code, entry, input]: Parameters<typeof traceProgram>) {
  return new Promise<ReturnType<typeof traceProgram>>((resolve, reject) => {
    const worker = new Worker(new URL("./browser-worker.ts", import.meta.url), { type: "module" });
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("The trace exceeded five seconds."));
    }, 5000);
    function finish() {
      clearTimeout(timeout);
      worker.terminate();
    }
    worker.onmessage = ({ data }) => {
      finish();
      if (data.error) reject(new Error(data.error));
      else resolve(data.result);
    };
    worker.onerror = () => {
      finish();
      reject(new Error("The trace worker stopped."));
    };
    worker.postMessage({ code, entry, input });
  });
}
