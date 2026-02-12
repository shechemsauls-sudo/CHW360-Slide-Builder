"use client";

import { createClient } from "~/lib/supabase/client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "claim">("password");
  const [claimSent, setClaimSent] = useState(false);

  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/admin";
    }
  }

  async function handleClaimAccount(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/callback?next=/admin` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setClaimSent(true);
      setLoading(false);
    }
  }

  if (claimSent) {
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
            We sent a magic link to <strong>{email}</strong>. Click the link in your email to sign in.
          </p>
          <button
            onClick={() => { setClaimSent(false); setMode("password"); }}
            className="text-sm font-medium underline"
            style={{ color: "#2D5A5A" }}
          >
            Back to sign in
          </button>
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
          <h1 className="text-xl font-bold" style={{ color: "#2D5A5A" }}>
            {mode === "password" ? "Sign In" : "Claim Your Account"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#4A5568" }}>
            {mode === "password" ? "Access the admin dashboard" : "Enter your email to receive a magic link"}
          </p>
        </div>

        {mode === "password" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: "#2D5A5A" }}>
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium" style={{ color: "#2D5A5A" }}>
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: "#C9725B" }}>
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
              ) : (
                "Sign In"
              )}
            </Button>

            <p className="text-center text-sm" style={{ color: "#4A5568" }}>
              Invited user?{" "}
              <button
                onClick={() => { setMode("claim"); setError(null); }}
                className="font-medium underline"
                style={{ color: "#2D5A5A" }}
              >
                Claim your account
              </button>
            </p>
          </form>
        )}

        {mode === "claim" && (
          <form onSubmit={handleClaimAccount} className="space-y-4">
            <div>
              <label htmlFor="claim-email" className="block text-sm font-medium" style={{ color: "#2D5A5A" }}>
                Email
              </label>
              <Input
                id="claim-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your invited email"
                className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending link...</>
              ) : (
                "Send Magic Link"
              )}
            </Button>

            <p className="text-center text-sm" style={{ color: "#4A5568" }}>
              Have a password?{" "}
              <button
                onClick={() => { setMode("password"); setError(null); }}
                className="font-medium underline"
                style={{ color: "#2D5A5A" }}
              >
                Sign in with password
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
