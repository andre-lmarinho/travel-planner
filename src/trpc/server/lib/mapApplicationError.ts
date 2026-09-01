import { TRPCError } from "@trpc/server";
import { ApplicationError } from "@/lib/errors";

function getApplicationError(error: unknown): ApplicationError | null {
  if (error instanceof ApplicationError) return error;
  if (error instanceof TRPCError && error.cause instanceof ApplicationError) return error.cause;

  return null;
}

export function mapApplicationError(error: unknown): TRPCError | null {
  const applicationError = getApplicationError(error);
  if (!applicationError) return null;

  return new TRPCError({
    cause: applicationError.cause ?? applicationError,
    code: applicationError.code,
    message: applicationError.message,
  });
}
