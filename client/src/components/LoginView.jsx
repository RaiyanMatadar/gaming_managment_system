import React, { useState } from 'react';
import { Gamepad2, Lock, User, Eye, EyeOff, ShieldAlert, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, Button, Input, Badge } from './ui';
import { loginUser } from '../utils/api.js';

export function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both your username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await loginUser(username.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess(result.user, result.token);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-center items-center p-4 sm:p-6 transition-colors selection:bg-primary-container selection:text-on-primary-container">
      {/* Decorative ambient subtle background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-secondary/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-[22px] bg-primary text-on-primary shadow-m3-2 flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-200">
            <Gamepad2 className="w-9 h-9" />
          </div>
          <h1 className="display-small font-bold text-on-surface tracking-tight">GameDash</h1>
          <p className="body-medium text-on-surface-variant mt-1.5">
            Enterprise Gaming Center Management Portal
          </p>
        </div>

        {/* Main Authentication Card */}
        <Card
          variant="container"
          rounded="rounded-[28px]"
          className="p-6 sm:p-8 border border-outline-variant/40 shadow-m3-3 backdrop-blur-md"
        >
          <div className="mb-6">
            <h2 className="title-large font-semibold text-on-surface">Welcome Back</h2>
            <p className="body-small text-on-surface-variant mt-1">
              Sign in to manage your gaming stations, sessions, and sales.
            </p>
          </div>

          {/* Error Feedback Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-[12px] bg-error-container text-on-error-container flex items-start gap-3 text-body-small animate-in fade-in slide-in-from-top-1 duration-200">
              <ShieldAlert className="w-5 h-5 shrink-0 text-error mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-label-medium text-on-surface-variant block">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <User className="w-4 h-4" />
                </div>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage('');
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-label-medium text-on-surface-variant block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="••••••••••••"
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="filled"
                size="lg"
                fullWidth
                disabled={isLoading}
                className="font-semibold shadow-m3-1 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Admin Manual Provisioning Policy Callout */}
          <div className="mt-6 pt-5 border-t border-outline-variant/30">
            <div className="flex items-start gap-2.5 p-3 rounded-[14px] bg-surface-container-low border border-outline-variant/30">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-[12px] leading-relaxed text-on-surface-variant">
                <strong className="text-on-surface font-medium block mb-0.5">
                  Multi-User Provisioning Policy
                </strong>
                Public self-registration is disabled. Manager & Cashier accounts are provisioned manually by the system administrator via Postman with an admin key.
              </div>
            </div>
          </div>
        </Card>

        {/* Footer info */}
        <p className="text-center text-label-small text-on-surface-variant/70 mt-6">
          GameDash System • Secure Multi-Tenant Architecture • 2026
        </p>
      </div>
    </div>
  );
}
