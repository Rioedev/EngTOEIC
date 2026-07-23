"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

class ProfileSyncError extends Error {}

function getAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLocaleLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (normalizedMessage.includes("email not confirmed")) {
    return "Email chưa được xác nhận. Hãy kiểm tra hộp thư rồi thử lại.";
  }
  if (
    normalizedMessage.includes("password") &&
    normalizedMessage.includes("least")
  ) {
    return "Mật khẩu chưa đáp ứng độ dài tối thiểu.";
  }
  if (normalizedMessage.includes("rate limit")) {
    return "Bạn đã thử quá nhiều lần. Vui lòng chờ một lúc rồi thử lại.";
  }

  return "Không thể xác thực tài khoản lúc này. Vui lòng thử lại.";
}

export function EmailPasswordAuthForm({
  nextPath = "/",
}: {
  nextPath?: string;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setMessage(null);
  }

  async function syncProfile(accessToken: string) {
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
    ).replace(/\/$/, "");
    const response = await fetch(`${apiUrl}/auth/sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new ProfileSyncError("Unable to sync the authenticated user.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Email chưa đúng định dạng.");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Mật khẩu nhập lại chưa khớp.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      if (mode === "login") {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

        if (signInError) throw signInError;
        if (!data.session) {
          throw new Error("No session returned after password sign in.");
        }

        await syncProfile(data.session.access_token);
        window.location.assign(nextPath);
        return;
      }

      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", nextPath);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: callbackUrl.toString() },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        await syncProfile(data.session.access_token);
        window.location.assign(nextPath);
        return;
      }

      setMessage(
        "Tài khoản đã được ghi nhận. Hãy kiểm tra email để xác nhận trước khi đăng nhập.",
      );
      setPassword("");
      setConfirmPassword("");
    } catch (authError) {
      if (authError instanceof ProfileSyncError) {
        await supabase.auth.signOut();
        setError(
          "Đăng nhập thành công nhưng chưa thể tạo hồ sơ học tập. Hãy bật API và thử lại.",
        );
      } else {
        setError(
          getAuthErrorMessage(
            authError instanceof Error ? authError.message : "Unknown error",
          ),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="email-auth">
      <div
        className="auth-mode-tabs"
        role="tablist"
        aria-label="Chọn hình thức xác thực"
      >
        <button
          className="auth-mode-tab"
          data-active={mode === "login"}
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          aria-controls="email-auth-panel"
          onClick={() => changeMode("login")}
        >
          Đăng nhập
        </button>
        <button
          className="auth-mode-tab"
          data-active={mode === "signup"}
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          aria-controls="email-auth-panel"
          onClick={() => changeMode("signup")}
        >
          Đăng ký
        </button>
      </div>

      <div id="email-auth-panel" role="tabpanel" className="auth-mode-panel">
        <form className="email-auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <div className="auth-input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input
                id="auth-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="ban@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "email-auth-error" : undefined}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Mật khẩu</label>
            <div className="auth-input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="Tối thiểu 8 ký tự"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                minLength={8}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "email-auth-error" : "password-hint"}
                required
              />
              <button
                className="auth-password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
            <p id="password-hint" className="auth-field-hint">
              Dùng ít nhất 8 ký tự.
            </p>
          </div>

          {mode === "signup" ? (
            <div className="auth-field">
              <label htmlFor="auth-confirm-password">Nhập lại mật khẩu</label>
              <div className="auth-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="auth-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isLoading}
                  minLength={8}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "email-auth-error" : undefined}
                  required
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <p
              id="email-auth-error"
              className="auth-form-feedback auth-form-error"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="auth-form-feedback auth-form-success" role="status">
              {message}
            </p>
          ) : null}

          <button
            className="email-auth-submit"
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? mode === "login"
                ? "Đang đăng nhập…"
                : "Đang tạo tài khoản…"
              : mode === "login"
                ? "Đăng nhập"
                : "Tạo tài khoản"}
          </button>
        </form>
      </div>

      <p className="auth-provider-note">
        Đăng nhập Google đang tạm tắt trong giai đoạn phát triển.
      </p>
    </div>
  );
}
