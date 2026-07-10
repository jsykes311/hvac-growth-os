import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleBusinessProfileCode, syncGoogleBusinessProfileData } from "@/lib/server/google-business-profile";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return callbackErrorResponse("Google Business Profile did not return an authorization code.");

  try {
    await exchangeGoogleBusinessProfileCode({ code, origin: request.nextUrl.origin });
    try {
      await syncGoogleBusinessProfileData();
    } catch (error) {
      console.error("Initial Google Business Profile sync failed", error);
    }
    return NextResponse.redirect(new URL("/?connectedApps=google-business-profile#google-business-profile", request.nextUrl.origin));
  } catch (error) {
    console.error("Google Business Profile OAuth callback failed", error);
    return callbackErrorResponse("Google Business Profile authorization could not be completed.");
  }
}

function callbackErrorResponse(message: string) {
  return new NextResponse(
    `<!doctype html>
      <html>
        <head><title>Google Business Profile connection needs review</title></head>
        <body style="font-family: system-ui, sans-serif; margin: 48px; color: #082f3f;">
          <h1>${message}</h1>
          <p>Return to Connected Apps and review Google Business Profile Setup before trying again.</p>
          <a href="/?connectedApps=google-business-profile-setup#google-business-profile-setup">Back to Google Business Profile Setup</a>
        </body>
      </html>`,
    { headers: { "Content-Type": "text/html" }, status: 400 },
  );
}
