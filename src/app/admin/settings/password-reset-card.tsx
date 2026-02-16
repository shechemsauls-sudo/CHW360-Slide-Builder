"use client";

import { useState } from "react";
import { createClient } from "~/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PasswordResetCard({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to send reset email. Please try again.");
    } else {
      toast.success("Password reset email sent! Check your inbox.");
    }
  };

  return (
    <Card className="border-0 bg-white/5">
      <CardHeader>
        <CardTitle className="text-white">Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400">
          Reset your password by receiving a reset link at your email address.
        </p>
        <Button
          onClick={handleReset}
          disabled={loading}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Password Reset Link"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
