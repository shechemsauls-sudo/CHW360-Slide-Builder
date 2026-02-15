import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  try { await import("~/server/api/routers/deck"); checks.router_deck = "ok"; }
  catch (e) { checks.router_deck = e instanceof Error ? e.message : String(e); }

  try { await import("~/server/api/routers/contact"); checks.router_contact = "ok"; }
  catch (e) { checks.router_contact = e instanceof Error ? e.message : String(e); }

  try { await import("~/server/api/routers/analytics"); checks.router_analytics = "ok"; }
  catch (e) { checks.router_analytics = e instanceof Error ? e.message : String(e); }

  try { await import("~/server/api/routers/users"); checks.router_users = "ok"; }
  catch (e) { checks.router_users = e instanceof Error ? e.message : String(e); }

  try { await import("~/server/api/routers/crm"); checks.router_crm = "ok"; }
  catch (e) { checks.router_crm = e instanceof Error ? e.message : String(e); }

  try { await import("~/lib/ai/llm"); checks.lib_llm = "ok"; }
  catch (e) { checks.lib_llm = e instanceof Error ? e.message : String(e); }

  try { await import("~/lib/ai/image"); checks.lib_image = "ok"; }
  catch (e) { checks.lib_image = e instanceof Error ? e.message : String(e); }

  try { await import("~/lib/parsers"); checks.lib_parsers = "ok"; }
  catch (e) { checks.lib_parsers = e instanceof Error ? e.message : String(e); }

  try { await import("~/lib/storage/upload-image"); checks.lib_storage = "ok"; }
  catch (e) { checks.lib_storage = e instanceof Error ? e.message : String(e); }

  return NextResponse.json(checks, { status: 200 });
}
