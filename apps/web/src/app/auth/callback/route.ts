import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function loginErrorUrl(request: NextRequest, error: string, nextPath: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  url.searchParams.set("next", nextPath);
  return url;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (oauthError) {
    return NextResponse.redirect(loginErrorUrl(request, "access_denied", nextPath));
  }

  if (!code) {
    return NextResponse.redirect(loginErrorUrl(request, "missing_code", nextPath));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(loginErrorUrl(request, "callback_failed", nextPath));
  }

  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  try {
    const syncResponse = await fetch(`${apiUrl.replace(/\/$/, "")}/auth/sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
      cache: "no-store"
    });

    if (!syncResponse.ok) {
      throw new Error(`Auth sync failed with status ${syncResponse.status}`);
    }
  } catch (syncError) {
    console.error("Unable to sync Supabase user with API", syncError);
    await supabase.auth.signOut();
    return NextResponse.redirect(loginErrorUrl(request, "sync_failed", nextPath));
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
