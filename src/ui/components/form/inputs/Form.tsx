"use client";

import type { FieldValues, SubmitErrorHandler, SubmitHandler, UseFormReturn } from "react-hook-form";
import { FormProvider } from "react-hook-form";

type FormProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  onError?: SubmitErrorHandler<T>;
} & Omit<JSX.IntrinsicElements["form"], "onSubmit">;

export function Form<T extends FieldValues>({ form, onSubmit, onError, children, ...props }: FormProps<T>) {
  return (
    <FormProvider {...form}>
      <form
        {...props}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit(onSubmit, onError)(event);
        }}>
        {children}
      </form>
    </FormProvider>
  );
}
