"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { error: null, username: "" };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const hasError = Boolean(state.error);

  return (
    <form action={formAction} className="space-y-4" noValidate={false}>
      <input type="hidden" name="next" value={next} />

      {state.error ? (
        <Alert tone="danger" role="alert" id="login-error">
          {state.error}
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          required
          maxLength={64}
          defaultValue={state.username}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? "login-error" : undefined}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="current-password">Password</Label>
        <div className="relative">
          <Input
            id="current-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            enterKeyHint="done"
            required
            maxLength={256}
            className="pr-11"
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? "login-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            aria-controls="current-password"
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-subtle hover:text-fg"
          >
            {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
