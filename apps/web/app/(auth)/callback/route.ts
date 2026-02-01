import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const next = redirectTo.startsWith("/") ? redirectTo : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successfully authenticated, redirect to the intended destination
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Auth callback error:", error);
  }

  // Authentication failed - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
