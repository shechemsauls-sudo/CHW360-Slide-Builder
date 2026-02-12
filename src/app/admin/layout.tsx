import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "~/lib/supabase/server";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema";
import { AdminDashboardLayout } from "~/components/admin/admin-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.authId, user.id))
      .limit(1);

    if (!profile || profile.role !== "admin") {
      redirect("/?error=access_denied");
    }
  } catch {
    redirect("/login?error=server_error");
  }

  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}
