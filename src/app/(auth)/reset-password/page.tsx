"use client";

import { createClient } from "~/lib/supabase/client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event (hash-based flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if user already has a session (PKCE flow — callback already exchanged the code)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setReady(true);
      } else {
        // Give the auth event listener a moment, then show failure
        setTimeout(() => {
          setCheckFailed(true);
        }, 3000);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        window.location.href = "/admin";
      }, 2000);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#F5EDE6" }}>
        <div className="w-full max-w-sm space-y-4 rounded-xl p-8 text-center" style={{ backgroundColor: "#EDE4DA" }}>
          <div className="mb-4 flex items-center justify-center gap-2">
            <Image src="/chw/logo.png" alt="CHW360" width={40} height={40} />
            <span className="text-2xl tracking-tight" style={{ color: "#2D5A5A" }}>
              <span className="font-semibold">CHW</span>
              <span className="font-light" style={{ color: "#6B8A8A" }}>360</span>
            </span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#2D5A5A" }}>Password Updated</h1>
          <p className="text-sm" style={{ color: "#4A5568" }}>
            Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#F5EDE6" }}>
        <div className="w-full max-w-sm space-y-4 rounded-xl p-8 text-center" style={{ backgroundColor: "#EDE4DA" }}>
          <div className="mb-4 flex items-center justify-center gap-2">
            <Image src="/chw/logo.png" alt="CHW360" width={40} height={40} />
            <span className="text-2xl tracking-tight" style={{ color: "#2D5A5A" }}>
              <span className="font-semibold">CHW</span>
              <span className="font-light" style={{ color: "#6B8A8A" }}>360</span>
            </span>
          </div>
          {checkFailed ? (
            <>
              <p className="text-sm" style={{ color: "#C9725B" }}>
                This reset link has expired or is invalid.
              </p>
              <a href="/forgot-password" className="inline-block text-sm font-medium underline" style={{ color: "#2D5A5A" }}>
                Request a new link
              </a>
            </>
          ) : (
            <>
              <Loader2 className="mx-auto h-6 w-6 animate-spin" style={{ color: "#2D5A5A" }} />
              <p className="text-sm" style={{ color: "#4A5568" }}>
                Verifying your reset link...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#F5EDE6" }}>
      <div className="w-full max-w-sm space-y-6 rounded-xl p-8" style={{ backgroundColor: "#EDE4DA" }}>
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Image src="/chw/logo.png" alt="CHW360" width={40} height={40} />
            <span className="text-2xl tracking-tight" style={{ color: "#2D5A5A" }}>
              <span className="font-semibold">CHW</span>
              <span className="font-light" style={{ color: "#6B8A8A" }}>360</span>
            </span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#2D5A5A" }}>Set New Password</h1>
          <p className="mt-1 text-sm" style={{ color: "#4A5568" }}>
            Choose a new password for your account
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium" style={{ color: "#2D5A5A" }}>New Password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 border-gray-300 bg-white text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium" style={{ color: "#2D5A5A" }}>Confirm Password</label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 border-gray-300 bg-white text-gray-900"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: "#C9725B" }}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
