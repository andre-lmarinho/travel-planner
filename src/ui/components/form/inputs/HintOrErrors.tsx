"use client";

import type { FieldValues } from "react-hook-form";
import { useFormContext } from "react-hook-form";

import { InputError } from "./InputError";

type HintsOrErrorsProps = {
  fieldName: string;
};

export function HintsOrErrors<T extends FieldValues = FieldValues>({ fieldName }: HintsOrErrorsProps) {
  const methods = useFormContext<T>();

  if (!methods) return null;

  const { formState } = methods;
  const fieldError = formState.errors[fieldName];
  const isFieldError = fieldError && "message" in fieldError && !fieldError.root;
  const message = isFieldError && typeof fieldError.message === "string" ? fieldError.message : null;

  if (message) return <InputError message={message} />;
  return null;
}
