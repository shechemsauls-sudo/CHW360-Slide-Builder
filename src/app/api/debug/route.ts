import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Check env vars
  checks.DATABASE_URL = process.env.DATABASE_URL ? "set" : "MISSING";
  checks.POSTGRES_URL = process.env.POSTGRES_URL
    ? process.env.POSTGRES_URL === ""
      ? "EMPTY_STRING"
      : "set"
    : "MISSING";
  checks.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? "set"
    : "MISSING";
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "set"
    : "MISSING";

  // 2. Try importing db
  try {
    const { db } = await import("~/server/db");
    checks.db_import = "ok";

    // 3. Try a simple query
    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`SELECT 1 as test`);
    checks.db_query = `ok (${JSON.stringify(result)})`.slice(0, 100);
  } catch (e) {
    checks.db_error = e instanceof Error ? e.message : String(e);
  }

  // 4. Try importing appRouter
  try {
    await import("~/server/api/root");
    checks.router_import = "ok";
  } catch (e) {
    checks.router_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(checks);
}
