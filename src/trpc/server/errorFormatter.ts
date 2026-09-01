import type { TRPCDefaultErrorShape } from "@trpc/server";
import { z } from "zod";

type ErrorFormatterOptions = {
  error: {
    cause?: unknown;
  };
  shape: TRPCDefaultErrorShape;
};

export function errorFormatter({ error, shape }: ErrorFormatterOptions) {
  if (!(error.cause instanceof z.ZodError)) return shape;

  const zodError = error.cause.flatten();
  const firstFieldError = Object.values(zodError.fieldErrors).flat()[0];

  return {
    ...shape,
    data: {
      ...shape.data,
      zodError,
    },
    message: firstFieldError ?? "Invalid request.",
  };
}
