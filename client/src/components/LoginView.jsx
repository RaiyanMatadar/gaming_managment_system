import React, { useState } from "react";
import {
  Gamepad2,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Flame,
  Monitor,
  Tv,
  CheckCircle2
} from "lucide-react";
import { Card, Button, Input } from "./ui";
import { loginUser } from "../utils/api.js";
import { CyberMatrixCanvas } from "./CyberMatrixCanvas.jsx";

export function LoginView({ onLoginSuccess, onBackToHome }) {
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
        overflow-x-hidden bg-background px-3 py-6 text-on-surface cyber-arena-grid
        selection:bg-primary selection:text-on-primary
        sm:px-6 lg:px-8
      "
    >
      {/* Back to Home Button */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Arena Home</span>
        </button>
      )}

      {/* Decorative ambient glowing gaming mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute left-1/4 top-1/6 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-tertiary/10 blur-[140px]" />
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-success/5 blur-[100px]" />
      </div>

      {/* 60fps Interactive Cyber Matrix Particles & Scanlines */}
      <CyberMatrixCanvas particleCount={36} interactive={true} className="opacity-70 pointer-events-none" />

      {/* Main Responsive Grid Container */}
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Side: Esports Arena Showcase & Gaming Visuals (Shown on lg screens) */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-6">
            <div className="relative rounded-[28px] overflow-hidden border border-outline-variant/40 shadow-2xl group">
              <div className="relative h-80 w-full overflow-hidden">
                <img
                  src="/images/gaming_lounge_banner.jpg"
                  alt="Esports Arena Gaming Lounge"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                
                {/* Floating Arena Live Badge */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-outline-variant/40 text-xs font-bold text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                  <span className="tracking-wider">ESPORTS ARENA GRID</span>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-black tracking-tight text-on-surface">
                    Level Up Your Gaming Center
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-md">
                    Live telemetry, automated session billing, WhatsApp alerts, and hardware monitoring built for gaming cafes.
                  </p>
                </div>
              </div>

              {/* Gaming feature highlights */}
              <div className="p-5 bg-surface-container/70 backdrop-blur-md border-t border-outline-variant/30 grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-on-surface">
                  <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold">PC Battlestations</p>
                    <p className="text-[11px] text-on-surface-variant">Liquid-cooled 240Hz Rigs</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-on-surface">
                  <div className="w-7 h-7 rounded-lg bg-tertiary/20 flex items-center justify-center text-tertiary shrink-0">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold">PS5 & Xbox Consoles</p>
                    <p className="text-[11px] text-on-surface-variant">4K 120Hz OLED Stations</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-on-surface">
                  <div className="w-7 h-7 rounded-lg bg-success/20 flex items-center justify-center text-success shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold">Deterministic Billing</p>
                    <p className="text-[11px] text-on-surface-variant">5-Min Grace & Auto-Blocks</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-on-surface">
                  <div className="w-7 h-7 rounded-lg bg-warning/20 flex items-center justify-center text-warning shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold">WhatsApp Dual-Alerts</p>
                    <p className="text-[11px] text-on-surface-variant">Manager & Gamer notifications</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: High-Tech Login Card */}
          <div className="w-full lg:col-span-5 max-w-[420px] mx-auto">
            {/* Brand Logo Header */}
            <div className="mb-4 sm:mb-6 flex items-center justify-center gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-container-high border border-outline-variant/50 p-2 shadow-lg animate-float">
                <img
                  src="/images/gamedash_esports_logo.svg"
                  alt="GameDash Esports Emblem"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-left">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-on-surface flex items-center gap-1.5">
                  GameDash
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/40 tracking-wider">
                    PRO
                  </span>
                </h1>
                <p className="text-xs text-on-surface-variant font-medium">
                  Gaming Center Terminal System
                </p>
              </div>
            </div>

            {/* Login Card */}
            <Card
              variant="container"
              rounded="rounded-2xl"
              className="
                border border-outline-variant/50 p-5 sm:p-6
                shadow-2xl backdrop-blur-xl bg-surface-container/90
              "
            >
              {/* Heading */}
              <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-on-surface">
                  Terminal Sign In
                </h2>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Enter authorized manager or cashier credentials.
                </p>
              </div>

              {/* Error message */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-xl bg-error-container p-3 text-xs sm:text-sm text-on-error-container border border-error/30"
                >
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                  <p className="min-w-0 flex-1 break-words font-medium">
                    {errorMessage}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-username"
                    className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                  >
                    Operator Username
                  </label>

                  <div className="relative">
                    <User
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                    />

                    <Input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="e.g. manager"
                      className="pl-10 text-sm"
                      autoComplete="username"
                      autoFocus
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                  >
                    Security Password
                  </label>

                  <div className="relative">
                    <Lock
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                    />

                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="••••••••"
                      className="pl-10 pr-11 text-sm font-mono"
                      autoComplete="current-password"
                      required
                      disabled={isLoading}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      className="
                        absolute right-1 top-1/2 flex h-8 w-8
                        -translate-y-1/2 cursor-pointer items-center
                        justify-center rounded-lg text-on-surface-variant
                        transition-colors hover:bg-surface-container-high
                        hover:text-on-surface
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                      "
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-outline" />
                      ) : (
                        <Eye className="h-4 w-4 text-outline" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="filled"
                    size="lg"
                    fullWidth
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 font-bold tracking-wide shadow-md cyber-glow-primary"
                  >
                    <span>{isLoading ? "Authenticating..." : "Access Arena Terminal"}</span>
                    {!isLoading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </form>

              {/* Account Provisioning Notice */}
              <div className="mt-4 border-t border-outline-variant/30 pt-4">
                <div className="flex items-start gap-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low p-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 text-[11px] leading-relaxed text-on-surface-variant">
                    <p className="font-semibold text-on-surface">
                      Arena Managed Access
                    </p>
                    Public signup is disabled. Contact system administrator for operator access provisioning.
                  </div>
                </div>
              </div>
            </Card>

            {/* Footer */}
            <p className="mt-4 text-center text-[11px] text-on-surface-variant/70">
              GameDash · High-Performance Gaming Lounge Suite · 2026
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
