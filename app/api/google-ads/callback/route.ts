import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, syncGoogleAdsData } from "@/lib/server/google-ads";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code") || "";
    const state = request.nextUrl.searchParams.get("state") || "";
    const expectedState = request.cookies.get("google_ads_oauth_state")?.value || "";

    if (!code) throw new Error("Google did not return an authorization code.");
    if (!state || state !== expectedState) throw new Error("Google OAuth state validation failed.");

    await exchangeGoogleCode({ code, origin: request.nextUrl.origin });
    await syncGoogleAdsData().catch((error) => {
      console.error("Initial Google Ads sync failed", error);
    });

    const response = NextResponse.redirect(new URL("/?connectedApps=google-ads", request.nextUrl.origin));
    response.cookies.delete("google_ads_oauth_state");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to complete Google Ads OAuth." },
      { status: 500 },
    );
  }
}
