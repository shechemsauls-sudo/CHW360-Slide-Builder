"use client";

import { createClient } from "~/lib/supabase/client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  if (sent) {
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
          <h1 className="text-xl font-bold" style={{ color: "#2D5A5A" }}>Check your email</h1>
          <p className="text-sm" style={{ color: "#4A5568" }}>
            If an account exists for <strong>{email}</strong>, we sent a password reset link.
          </p>
          <a href="/login" className="inline-block text-sm font-medium underline" style={{ color: "#2D5A5A" }}>
            Back to sign in
          </a>
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
          <h1 className="text-xl font-bold" style={{ color: "#2D5A5A" }}>Reset Password</h1>
          <p className="mt-1 text-sm" style={{ color: "#4A5568" }}>
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium" style={{ color: "#2D5A5A" }}>Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 border-gray-200 bg-white"
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
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>

        <p className="text-center text-sm" style={{ color: "#4A5568" }}>
          Remember your password?{" "}
          <a href="/login" className="font-medium underline" style={{ color: "#2D5A5A" }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
