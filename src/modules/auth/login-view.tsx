"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { signInWithPassword } from "@/features/auth/handlers/signInWithPassword";
import { buildSignupHref, resolveNextPath } from "@/features/auth/lib/redirect";
import { getAuthErrorMessage } from "@/features/auth/utils/extractErrorMessage";
import { validEmail } from "@/features/auth/utils/validEmail";
import { demoSignIn } from "@/features/demo/lib/demoSignIn";
import { Button } from "@/shared/ui/button/Button";
import { EmailField, Form, PasswordField } from "@/shared/ui/form";
import { AccessShell } from "@/shared/ui/layout";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required.").refine(validEmail, "Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

type LoginValues = z.infer<typeof loginSchema>;

const DEFAULT_VALUES: LoginValues = {
  email: "",
  password: "",
};

const SIGN_IN_FALLBACK = "Unable to sign you in.";

type LoginViewProps = {
  resolveProfile: () => Promise<string>;
  nextPath?: string | null;
};

export function LoginView({ resolveProfile, nextPath }: LoginViewProps) {
  const router = useRouter();
  const safeNextPath = resolveNextPath(nextPath);
  const signupHref = buildSignupHref(safeNextPath);
  const forgotPasswordHref = safeNextPath
    ? `/forgot-password?next=${encodeURIComponent(safeNextPath)}`
    : "/forgot-password";
  const [formError, setFormError] = useState<string | null>(null);

  const formMethods = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const { register, formState } = formMethods;

  const handleSubmit: SubmitHandler<LoginValues> = async (values) => {
    setFormError(null);

    try {
      const { slug } = await signInWithPassword({
        email: values.email,
        password: values.password,
        resolveProfile,
      });

      router.push(safeNextPath ?? `/u/${slug}`);
      router.refresh();
    } catch (error) {
      setFormError(getAuthErrorMessage(error, SIGN_IN_FALLBACK));
    }
  };

  const handleDemo = async () => {
    setFormError(null);
    try {
      const slug = await demoSignIn(resolveProfile);
      router.push(`/u/${slug}`);
      router.refresh();
    } catch (error) {
      setFormError(getAuthErrorMessage(error, SIGN_IN_FALLBACK));
    }
  };

  return (
    <AccessShell
      title="Welcome back"
      footer={
        <Link href={signupHref} className="text-foreground hover:underline">
          Don't have an account?
        </Link>
      }>
      <Form form={formMethods} onSubmit={handleSubmit} className="grid gap-6" noValidate>
        <EmailField
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          {...register("email")}
        />
        <PasswordField
          label={
            <span className="flex w-full items-center justify-between">
              <span>Password</span>
              <Link href={forgotPasswordHref} className="text-muted-foreground hover:underline">
                Forgot?
              </Link>
            </span>
          }
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          {...register("password")}
        />
        {formError ? (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={formState.isSubmitting} className="text-base font-semibold">
          {formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </Form>
      <div className="border-border mt-5 border-t pt-5">
        <Button
          variant="accent"
          onClick={handleDemo}
          className="w-full py-3 text-base font-semibold shadow-sm transition-colors">
          Explore the demo — no account needed
        </Button>
      </div>
    </AccessShell>
  );
}
