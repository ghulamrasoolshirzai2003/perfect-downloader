/**
 * Machine-readable error codes shared by the API and every client (web, future mobile apps).
 * Clients translate codes into localized, human-friendly messages; the API's `message`
 * field is a developer-facing fallback only.
 */
export const ERROR_CODES = [
  'INVALID_URL',
  'UNSUPPORTED_PLATFORM',
  'CONTENT_UNAVAILABLE',
  'AUTHORIZATION_REQUIRED',
  'DOWNLOAD_NOT_PERMITTED',
  'ATTESTATION_REQUIRED',
  'INVALID_FILE',
  'FILE_TOO_LARGE',
  'TOO_MANY_FILES',
  'UNSUPPORTED_FORMAT',
  'INVALID_OPTIONS',
  'RATE_LIMITED',
  'QUOTA_EXCEEDED',
  'PROCESSING_FAILED',
  'PROCESSING_TIMEOUT',
  'JOB_NOT_FOUND',
  'JOB_NOT_READY',
  'JOB_EXPIRED',
  'FILE_EXPIRED',
  'INSPECTION_EXPIRED',
  'TEMPORARY_SERVICE_UNAVAILABLE',
  'PLATFORM_TEMPORARILY_UNAVAILABLE',
  'UNAUTHORIZED',
  'NOT_FOUND',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** HTTP status used by the API for each code. */
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  INVALID_URL: 400,
  UNSUPPORTED_PLATFORM: 422,
  CONTENT_UNAVAILABLE: 404,
  AUTHORIZATION_REQUIRED: 403,
  DOWNLOAD_NOT_PERMITTED: 403,
  ATTESTATION_REQUIRED: 428,
  INVALID_FILE: 400,
  FILE_TOO_LARGE: 413,
  TOO_MANY_FILES: 400,
  UNSUPPORTED_FORMAT: 415,
  INVALID_OPTIONS: 400,
  RATE_LIMITED: 429,
  QUOTA_EXCEEDED: 429,
  PROCESSING_FAILED: 422,
  PROCESSING_TIMEOUT: 504,
  JOB_NOT_FOUND: 404,
  JOB_NOT_READY: 409,
  JOB_EXPIRED: 410,
  FILE_EXPIRED: 410,
  INSPECTION_EXPIRED: 410,
  TEMPORARY_SERVICE_UNAVAILABLE: 503,
  PLATFORM_TEMPORARILY_UNAVAILABLE: 503,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    /** Optional structured details safe to show to clients (never internal paths or stack traces). */
    details?: Record<string, unknown>;
    /** Seconds until the client may retry (rate limits / temporary outages). */
    retryAfter?: number;
  };
}

/** Error class usable on both server and client to carry a typed code. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;
  readonly retryAfter?: number;

  constructor(
    code: ErrorCode,
    message?: string,
    opts: { details?: Record<string, unknown>; retryAfter?: number; cause?: unknown } = {},
  ) {
    super(message ?? code, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.status = ERROR_HTTP_STATUS[code];
    this.details = opts.details;
    this.retryAfter = opts.retryAfter;
  }

  toBody(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
        ...(this.retryAfter !== undefined ? { retryAfter: this.retryAfter } : {}),
      },
    };
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && (ERROR_CODES as readonly string[]).includes(value);
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
