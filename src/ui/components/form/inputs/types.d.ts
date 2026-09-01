import type { VariantProps } from "class-variance-authority";

import type { inputStyles } from "./TextField";

export type InputProps = Omit<JSX.IntrinsicElements["input"], "size" | "ref"> &
  VariantProps<typeof inputStyles>;

export type InputFieldProps = InputProps & {
  label?: React.ReactNode;
  addOnSuffix?: React.ReactNode;
};
