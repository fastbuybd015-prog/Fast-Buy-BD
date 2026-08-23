import { ERROR_CODES, type ErrorCode } from "./error-codes";

/**
 * Base class for every expected (i.e. non-bug) failure in the application.
 *
 * Services throw these; the central error handler turns them into the
 * standard error envelope. Anything that is NOT an AppError is treated as an
 * unexpected bug: it is logged in full and reported to the client as a
 * generic 500 without leaking internals.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  /** Safe, structured extra information for the client. Never secrets. */
  readonly details?: unknown;

  constructor(params: {
    statusCode: number;
    code: ErrorCode;
    message: string;
    details?: unknown;
    cause?: unknown;
  }) {
    super(params.message, { cause: params.cause });
    this.name = new.target.name;
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.details = params.details;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class ValidationError extends AppError {
  constructor(message = "The submitted data is invalid.", details?: unknown) {
    super({ statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR, message, details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required.") {
    super({ statusCode: 401, code: ERROR_CODES.UNAUTHORIZED, message });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You are not allowed to perform this action.") {
    super({ statusCode: 403, code: ERROR_CODES.FORBIDDEN, message });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super({ statusCode: 404, code: ERROR_CODES.NOT_FOUND, message });
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "This action conflicts with the current state.",
    code: ErrorCode = ERROR_CODES.CONFLICT,
  ) {
    super({ statusCode: 409, code, message });
  }
}

/**
 * A dependency the feature needs (database, Supabase, Redis) is not
 * configured or not reachable.
 *
 * Used instead of faking a successful response — see the "no fake
 * implementation" rule in Backend Master Context §211.
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = "This feature is temporarily unavailable.", details?: unknown) {
    super({ statusCode: 503, code: ERROR_CODES.SERVICE_UNAVAILABLE, message, details });
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
