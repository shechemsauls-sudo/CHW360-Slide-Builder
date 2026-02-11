import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

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

      <Card className="border-0 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-400">Email</label>
            <p className="mt-1 text-white">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400">User ID</label>
            <p className="mt-1 font-mono text-sm text-gray-300">{user.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400">Last Sign In</label>
            <p className="mt-1 text-sm text-gray-300">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-400">
          <p>Next.js + tRPC + Drizzle + Supabase</p>
          <p>Database prefix: chw360_*</p>
        </CardContent>
      </Card>
    </div>
  );
}
