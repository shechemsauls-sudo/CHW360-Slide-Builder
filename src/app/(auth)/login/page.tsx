"use client";

import { createClient } from "~/lib/supabase/client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function handleOAuthLogin(provider: "google" | "github") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/callback` },
    });
    if (error) setError(error.message);
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
          <h1 className="text-xl font-bold" style={{ color: "#2D5A5A" }}>Sign In</h1>
          <p className="mt-1 text-sm" style={{ color: "#4A5568" }}>Access the admin dashboard</p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full border-gray-200 bg-white text-sm font-medium hover:bg-gray-50"
            style={{ color: "#4A5568" }}
            onClick={() => handleOAuthLogin("google")}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full border-gray-200 bg-white text-sm font-medium hover:bg-gray-50"
            style={{ color: "#4A5568" }}
            onClick={() => handleOAuthLogin("github")}
          >
            Continue with GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 text-gray-500" style={{ backgroundColor: "#EDE4DA" }}>or</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
          <div>
            <label htmlFor="password" className="block text-sm font-medium" style={{ color: "#2D5A5A" }}>Password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm" style={{ color: "#4A5568" }}>
          Don&apos;t have an account?{" "}
          <a href="/signup" className="font-medium underline" style={{ color: "#2D5A5A" }}>Sign up</a>
        </p>
      </div>
    </div>
  );
}
