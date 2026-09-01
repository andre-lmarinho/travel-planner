"use client";

import { forwardRef, useState } from "react";

import { Eye, EyeOff } from "@/ui/components/icon/lucide-icons";
import { Tooltip } from "@/ui/components/tooltip/Tooltip";

import { InputField } from "./TextField";
import type { InputFieldProps } from "./types";

export const EmailField = forwardRef<HTMLInputElement, InputFieldProps>(function EmailField(props, ref) {
  return (
    <InputField
      ref={ref}
      type="email"
      autoCapitalize="none"
      autoComplete="email"
      autoCorrect="off"
      inputMode="email"
      {...props}
    />
  );
});

export const PasswordField = forwardRef<HTMLInputElement, InputFieldProps>(
  function PasswordField(props, ref) {
    const [isVisible, setIsVisible] = useState(false);
    const toggleVisibility = () => setIsVisible((prev) => !prev);

    const toggleLabel = isVisible ? "Hide password" : "Show password";

    return (
      <InputField
        ref={ref}
        type={isVisible ? "text" : "password"}
        addOnSuffix={
          <Tooltip content={toggleLabel}>
            <button
              type="button"
              onClick={toggleVisibility}
              aria-label={toggleLabel}
              aria-pressed={isVisible}
              className="text-muted-foreground hover:text-foreground flex items-center">
              {isVisible ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </Tooltip>
        }
        {...props}
      />
    );
  }
);
