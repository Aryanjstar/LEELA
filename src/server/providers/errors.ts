export type ProviderErrorKind =
  | "rate_limited"
  | "quota"
  | "auth"
  | "invalid"
  | "unavailable"
  | "policy";

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;
  readonly retryAfterMs?: number;

  constructor(kind: ProviderErrorKind, message: string, retryAfterMs?: number) {
    super(message);
    this.name = "ProviderError";
    this.kind = kind;
    this.retryAfterMs = retryAfterMs;
  }
}

export function classifyStatus(status: number, retryAfterMs?: number): ProviderErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 402) return "quota";
  if (status === 429) return "rate_limited";
  if (status === 400 || status === 422) return "invalid";
  if (status >= 500) return "unavailable";
  return "unavailable";
}

export { classifyStatus as statusKind };
