import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PasswordResetCard } from "./password-reset-card";
import { ProfileCard } from "./profile-card";

export const metadata: Metadata = {
  title: "Settings — CHW360",
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <ProfileCard email={user.email ?? ""} />

      <PasswordResetCard email={user.email ?? ""} />

      <Card className="border border-white/10 bg-white/[0.07]">
        <CardHeader>
          <CardTitle className="text-white">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium" style={{ color: "#8AACAC" }}>User ID</label>
            <p className="mt-1 font-mono text-sm text-gray-300">{user.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: "#8AACAC" }}>Last Sign In</label>
            <p className="mt-1 text-sm text-gray-300">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
