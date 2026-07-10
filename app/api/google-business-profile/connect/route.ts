import { NextRequest, NextResponse } from "next/server";
import { buildGoogleBusinessProfileOAuthUrl, googleBusinessProfileSetupStatus } from "@/lib/server/google-business-profile";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const setup = googleBusinessProfileSetupStatus();
    if (!setup.ready) return setupHelpResponse("Google Business Profile needs setup before OAuth can begin.");
    const origin = request.nextUrl.origin;
    const state = crypto.randomUUID();
    return NextResponse.redirect(buildGoogleBusinessProfileOAuthUrl({ origin, state }));
  } catch (error) {
    console.error("Google Business Profile OAuth start failed", error);
    return setupHelpResponse("Google Business Profile connection could not start.");
  }
}

function setupHelpResponse(message: string) {
  return new NextResponse(
    `<!doctype html>
      <html>
        <head><title>Google Business Profile setup needed</title></head>
        <body style="font-family: system-ui, sans-serif; margin: 48px; color: #082f3f;">
          <h1>${message}</h1>
          <p>Open HVAC Growth OS, go to Connected Apps, then review Google Business Profile Setup.</p>
          <a href="/?connectedApps=google-business-profile-setup#google-business-profile-setup">Back to Google Business Profile Setup</a>
        </body>
      </html>`,
    { headers: { "Content-Type": "text/html" }, status: 409 },
  );
}
