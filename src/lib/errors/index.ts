export class AppError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  return DEFAULT_MESSAGE;
}

export function logServerError(context: string, error: unknown) {
  console.error(`[${context}]`, describeError(error));
}

function describeError(error: unknown): unknown {
  if (!error || typeof error !== "object") return error;
  const e = error as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of ["name", "message", "code", "details", "hint", "status"]) {
    if (e[key] !== undefined && e[key] !== "") out[key] = e[key];
  }
  if (e.cause) out.cause = describeError(e.cause);
  return Object.keys(out).length > 0 ? out : error;
}
