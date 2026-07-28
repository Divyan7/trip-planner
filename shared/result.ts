/**
 * Discriminated union for every API/parse outcome. The client can never
 * "forget" to handle failure — TypeScript forces the ok-branch check.
 */
export type ErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'AUTH'
  | 'UNPARSEABLE'
  | 'INVALID_SHAPE'
  | 'EMPTY'
  | 'PROVIDER'
  | 'UNKNOWN';

export interface Meta {
  model: string;
  latencyMs: number;
  repairAttempts: number;
}

export type Ok<T> = {
  ok: true;
  data: T;
  warnings: string[];
  meta: Meta;
};

export type Err = {
  ok: false;
  code: ErrorCode;
  message: string;
  /** Raw model output, included only for parse failures in non-production. */
  raw?: string;
  /** Validation issue summaries, when the shape was wrong. */
  issues?: string[];
};

export type Result<T> = Ok<T> | Err;

export const ok = <T>(data: T, warnings: string[], meta: Meta): Ok<T> => ({
  ok: true,
  data,
  warnings,
  meta,
});

export const err = (code: ErrorCode, message: string, extra?: Partial<Err>): Err => ({
  ok: false,
  code,
  message,
  ...extra,
});
