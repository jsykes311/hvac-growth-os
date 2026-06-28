import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildGoogleOAuthUrl, isGoogleAdsConfigured } from "@/lib/server/google-ads";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (!isGoogleAdsConfigured()) {
      return NextResponse.redirect(new URL("/?connectedApps=google-ads-setup#google-ads-setup", request.nextUrl.origin));
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
    console.error("Google Ads OAuth start failed", error);
    return setupHelpResponse("Google Ads connection could not start.");
  }
}

function setupHelpResponse(title: string) {
  return new NextResponse(
    `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${title}</title>
          <style>
            body{margin:0;font-family:Inter,Arial,sans-serif;background:#f6faf8;color:#063944}
            main{min-height:100vh;display:grid;place-items:center;padding:32px}
            section{max-width:680px;background:white;border:1px solid rgba(6,57,68,.12);border-radius:24px;padding:32px;box-shadow:0 24px 70px rgba(6,57,68,.12)}
            h1{margin:0 0 12px;font-size:32px;line-height:1}
            p{line-height:1.6;color:#5d7175}
            a{display:inline-flex;margin-top:16px;padding:12px 18px;border-radius:999px;background:#063944;color:white;text-decoration:none;font-weight:800}
          </style>
        </head>
        <body>
          <main>
            <section>
              <h1>${title}</h1>
              <p>Google Ads needs setup before OAuth can begin. Open HVAC Growth OS, go to Connected Apps, then review Google Ads Setup.</p>
              <a href="/?connectedApps=google-ads-setup#google-ads-setup">Back to Google Ads Setup</a>
            </section>
          </main>
        </body>
      </html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 },
  );
}
