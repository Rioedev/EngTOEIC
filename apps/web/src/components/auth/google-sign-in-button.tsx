"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton({ nextPath = "/" }: { nextPath?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", nextPath);

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl.toString() }
      });

      if (signInError) {
        throw signInError;
      }
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Không thể kết nối với Google. Vui lòng thử lại."
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-action-group">
      <button
        className="google-sign-in-button"
        type="button"
        onClick={signInWithGoogle}
        disabled={isLoading}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z" />
          <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-4V7.3H3a10 10 0 0 0 0 9.4L6.4 14Z" />
          <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3 7.3L6.4 10c.8-2.4 3-4.1 5.6-4.1Z" />
        </svg>
        <span>{isLoading ? "Đang chuyển đến Google…" : "Tiếp tục với Google"}</span>
      </button>
      {error ? <p className="auth-inline-error" role="alert">{error}</p> : null}
    </div>
  );
}
