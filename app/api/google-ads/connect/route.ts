import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildGoogleOAuthUrl, isGoogleAdsConfigured } from "@/lib/server/google-ads";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (!isGoogleAdsConfigured()) {
      throw new Error("Google Ads is not configured. Add OAuth, developer token, and token encryption env vars first.");
    }

    const state = crypto.randomBytes(24).toString("hex");
    const redirect = NextResponse.redirect(buildGoogleOAuthUrl({ origin: request.nextUrl.origin, state }));
    redirect.cookies.set("google_ads_oauth_state", state, {
      httpOnly: true,
      maxAge: 10 * 60,
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
    return redirect;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start Google Ads OAuth." },
      { status: 500 },
    );
  }
}
