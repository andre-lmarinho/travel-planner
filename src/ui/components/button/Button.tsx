"use client";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import Link from "next/link";
import type React from "react";
import { forwardRef } from "react";
import { cn } from "@/ui/utils/cn";

const buttonVariants = cva(
  "focus-visible:ring-primary/60 inline-flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        accent: "bg-accent text-foreground",
        ghost: "bg-background text-foreground",
      },
    },
    defaultVariants: { variant: "primary" },
  }
);

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

type AnchorButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
};

type NativeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: undefined;
  variant?: ButtonVariant;
};

type ButtonProps = (AnchorButtonProps | NativeButtonProps) & {
  className?: string;
  children?: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ children, className, variant, href, ...props }, ref) => {
    if (href) {
      const anchorProps = props as React.AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <Link
          {...anchorProps}
          href={href}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          className={cn(buttonVariants({ variant }), className)}>
          {children}
        </Link>
      );
    }

    const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        {...buttonProps}
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        type={buttonProps.type ?? "button"}
        className={cn(buttonVariants({ variant }), className)}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
