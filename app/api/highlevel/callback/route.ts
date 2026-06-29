import { NextRequest, NextResponse } from "next/server";
import { exchangeHighLevelCode, syncHighLevelData } from "@/lib/server/highlevel";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code") || "";
    const state = request.nextUrl.searchParams.get("state") || "";
    const expectedState = request.cookies.get("highlevel_oauth_state")?.value || "";

    if (!code) throw new Error("HighLevel did not return an authorization code.");
    if (!state || state !== expectedState) throw new Error("HighLevel OAuth state validation failed.");

    await exchangeHighLevelCode({ code, origin: request.nextUrl.origin });
    await syncHighLevelData().catch((error) => {
      console.error("Initial HighLevel sync failed", error);
    });

    const response = NextResponse.redirect(new URL("/?connectedApps=highlevel", request.nextUrl.origin));
    response.cookies.delete("highlevel_oauth_state");
    return response;
  } catch (error) {
    console.error("HighLevel OAuth callback failed", error);
    return new NextResponse(
      `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>HighLevel connection needs review</title>
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
                <h1>HighLevel connection needs review</h1>
                <p>The authorization could not be completed. Return to Connected Apps and review HighLevel Setup before trying again.</p>
                <a href="/?connectedApps=highlevel-setup#highlevel-setup">Back to HighLevel Setup</a>
              </section>
            </main>
          </body>
        </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 },
    );
  }
}
