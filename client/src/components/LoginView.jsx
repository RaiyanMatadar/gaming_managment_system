
import React, { useState } from "react";
import {
  Gamepad2,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Card, Button, Input } from "./ui";
import { loginUser } from "../utils/api.js";

export function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      setErrorMessage("Please enter both your username and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await loginUser(username.trim(), password);

      if (onLoginSuccess) {
        onLoginSuccess(result.user, result.token);
      }
    } catch (err) {
      setErrorMessage(
        err.message || "Invalid username or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="
        relative flex min-h-[100svh] w-full items-center justify-center
        overflow-x-hidden bg-background px-3 py-3 text-on-surface
        selection:bg-primary-container selection:text-on-primary-container
        min-[400px]:px-4
        sm:px-6 sm:py-4
        max-[360px]:py-2
        max-[360px]:[&_*]:scroll-m-0
      "
    >
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-secondary/10 blur-3xl sm:h-80 sm:w-80" />
      </div>

      {/* Responsive page container */}
      <div
        className="
          relative z-10 mx-auto w-full max-w-[400px] py-1
          min-[400px]:py-2
          max-[360px]:py-0
        "
      >
        {/* Brand header */}
        <div
          className="
            mb-3 flex items-center justify-center gap-3
            sm:mb-4
            max-[360px]:mb-2
            [@media(max-height:650px)]:mb-2
          "
        >
          <div
            className="
              flex h-11 w-11 shrink-0 items-center justify-center
              rounded-2xl bg-primary text-on-primary shadow-m3-1
              min-[400px]:h-12 min-[400px]:w-12
              [@media(max-height:650px)]:h-9
              [@media(max-height:650px)]:w-9
            "
          >
            <Gamepad2 className="h-6 w-6 [@media(max-height:650px)]:h-5 [@media(max-height:650px)]:w-5" />
          </div>

          <div className="min-w-0">
            <h1
              className="
                text-2xl font-bold leading-tight tracking-tight text-on-surface
                [@media(max-height:650px)]:text-xl
              "
            >
              GameDash
            </h1>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Gaming Center Management
            </p>
          </div>
        </div>

        {/* Login card */}
        <Card
          variant="container"
          rounded="rounded-2xl"
          className="
            border border-outline-variant/40 p-4
            shadow-m3-3 backdrop-blur-md
            min-[400px]:p-5
            sm:rounded-[24px] sm:p-6
            [@media(max-height:750px)]:p-4
            [@media(max-height:650px)]:p-3
            [@media(max-height:550px)]:p-2.5
          "
        >
          {/* Heading */}
          <div
            className="
              mb-4
              [@media(max-height:650px)]:mb-2
            "
          >
            <h2 className="text-xl font-semibold tracking-tight text-on-surface [@media(max-height:550px)]:text-lg">
              Welcome Back
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant [@media(max-height:550px)]:text-xs">
              Sign in to manage your computers, sessions, and sales.
            </p>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div
              role="alert"
              className="
                mb-4 flex items-start gap-2.5 rounded-xl
                bg-error-container p-3 text-sm text-on-error-container
                [@media(max-height:650px)]:mb-2
                [@media(max-height:650px)]:p-2
              "
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-error" />
              <p className="min-w-0 flex-1 break-words font-medium">
                {errorMessage}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="
              space-y-3.5
              max-[360px]:space-y-2.5
              [@media(max-height:650px)]:space-y-2
            "
          >
            {/* Username */}
            <div className="space-y-1.5 [@media(max-height:650px)]:space-y-1">
              <label
                htmlFor="login-username"
                className="block text-sm font-medium text-on-surface-variant"
              >
                Username
              </label>

              <div className="relative">
                <User
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                />

                <Input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="Enter your username"
                  className="pl-10"
                  autoComplete="username"
                  autoFocus
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 [@media(max-height:650px)]:space-y-1">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-on-surface-variant"
              >
                Password
              </label>

              <div className="relative">
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                />

                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="Enter your password"
                  className="pl-10 pr-11"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="
                    absolute right-1 top-1/2 flex h-9 w-9
                    -translate-y-1/2 cursor-pointer items-center
                    justify-center rounded-lg text-on-surface-variant
                    transition-colors hover:bg-surface-container-high
                    hover:text-on-surface
                    focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-primary
                  "
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-1 [@media(max-height:650px)]:pt-0">
              <Button
                type="submit"
                variant="filled"
                size="lg"
                fullWidth
                disabled={isLoading}
                className="flex items-center justify-center gap-2 font-semibold shadow-m3-1"
              >
                <span>{isLoading ? "Signing In..." : "Sign In"}</span>
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </form>

          {/* Account provisioning notice */}
          <div
            className="
              mt-4 border-t border-outline-variant/30 pt-4
              [@media(max-height:650px)]:mt-2
              [@media(max-height:650px)]:pt-2
              [@media(max-height:550px)]:mt-1.5
              [@media(max-height:550px)]:pt-1.5
            "
          >
            <div
              className="
                flex items-start gap-2.5 rounded-xl
                border border-outline-variant/30
                bg-surface-container-low p-3
                [@media(max-height:650px)]:p-2
              "
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

              <div className="min-w-0 text-xs leading-relaxed text-on-surface-variant [@media(max-height:550px)]:text-[11px]">
                <p className="mb-0.5 font-semibold text-on-surface">
                  Managed Accounts
                </p>
                Public registration is disabled. Accounts are created by the
                system administrator through the authorized API.
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p
          className="
            mt-3 text-center text-[11px] text-on-surface-variant/70
            sm:mt-4 sm:text-xs
            [@media(max-height:650px)]:mt-2
            [@media(max-height:550px)]:mt-1
          "
        >
          GameDash · Secure Gaming Center Management · 2026
        </p>
      </div>
    </main>
  );
}
