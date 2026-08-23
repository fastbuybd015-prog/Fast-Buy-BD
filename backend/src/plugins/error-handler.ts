import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { env } from "@/config/env";
import { isAppError } from "@/errors/app-error";
import { ERROR_CODES, type ErrorCode } from "@/errors/error-codes";
import { fail } from "@/utils/response";

/**
 * Central error handler (Backend Master Context §15).
 *
 * Guarantees:
 *   - every failure leaves as the standard error envelope;
 *   - stack traces and raw database errors never reach the client;
 *   - unexpected errors are logged in full with their request id.
 */

/** Map Fastify's built-in error statuses onto our own codes. */
function codeForStatus(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400:
      return ERROR_CODES.VALIDATION_ERROR;
    case 401:
      return ERROR_CODES.UNAUTHORIZED;
    case 403:
      return ERROR_CODES.FORBIDDEN;
    case 404:
      return ERROR_CODES.NOT_FOUND;
    case 409:
      return ERROR_CODES.CONFLICT;
    case 429:
      return ERROR_CODES.RATE_LIMITED;
    case 503:
      return ERROR_CODES.SERVICE_UNAVAILABLE;
    default:
      return ERROR_CODES.INTERNAL_ERROR;
  }
}

async function errorHandlerPlugin(app: FastifyInstance): Promise<void> {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // 1. Request failed Zod validation (params / query / body).
    if (hasZodFastifySchemaValidationErrors(error)) {
      request.log.info({ issues: error.validation }, "Request validation failed");

      return reply.status(400).send(
        fail(
          ERROR_CODES.VALIDATION_ERROR,
          "The submitted data is invalid.",
          error.validation.map((issue) => ({
            // "/items/0/quantity" -> "items.0.quantity"
            field: issue.instancePath.replace(/^\//, "").replaceAll("/", ".") || "(root)",
            message: issue.message ?? "Invalid value.",
          })),
        ),
      );
    }

    // 2. We produced a response that does not match its declared schema.
    //    This is always our bug, so it must be loud in the logs.
    if (isResponseSerializationError(error)) {
      request.log.error(
        { issues: error.cause.issues, method: error.method, url: error.url },
        "Response did not match its declared schema",
      );

      return reply
        .status(500)
        .send(fail(ERROR_CODES.INTERNAL_ERROR, "Something went wrong on our side."));
    }

    // 3. Expected application errors.
    if (isAppError(error)) {
      const log = error.statusCode >= 500 ? request.log.error : request.log.warn;
      log.call(request.log, { err: error, code: error.code }, error.message);

      return reply.status(error.statusCode).send(fail(error.code, error.message, error.details));
    }

    // 4. Errors raised by Fastify itself or its plugins (rate limit, payload
    //    too large, malformed JSON, ...).
    const statusCode = error.statusCode ?? 500;

    if (statusCode < 500) {
      request.log.warn({ err: error }, "Request rejected");
      return reply.status(statusCode).send(fail(codeForStatus(statusCode), error.message));
    }

    // 5. Anything else is an unhandled bug.
    request.log.error({ err: error }, "Unhandled error");

    return reply.status(500).send(
      fail(
        ERROR_CODES.INTERNAL_ERROR,
        "Something went wrong on our side.",
        // Only ever expose internals outside production.
        env.isProduction ? undefined : { message: error.message, stack: error.stack },
      ),
    );
  });

  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return reply
      .status(404)
      .send(fail(ERROR_CODES.NOT_FOUND, `Route ${request.method} ${request.url} does not exist.`));
  });
}

export default fp(errorHandlerPlugin, { name: "fastshopbd-error-handler" });
