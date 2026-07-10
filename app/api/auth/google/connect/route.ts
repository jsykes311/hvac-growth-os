import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_LOGIN_NEXT_COOKIE,
  GOOGLE_LOGIN_STATE_COOKIE,
  buildGoogleLoginUrl,
  googleLoginSetupStatus,
} from "@/lib/server/google-login";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const setup = googleLoginSetupStatus();
    if (!setup.ready) return setupHelpResponse("Google login needs setup before sign-in can begin.");

    const nextPath = safeNextPath(request.nextUrl.searchParams.get("next") || "");
    const state = crypto.randomUUID();
    const response = NextResponse.redirect(buildGoogleLoginUrl({ origin: request.nextUrl.origin, state }));
    response.cookies.set(GOOGLE_LOGIN_STATE_COOKIE, state, {
      httpOnly: true,
      maxAge: 60 * 10,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.set(GOOGLE_LOGIN_NEXT_COOKIE, nextPath, {
      httpOnly: true,
      maxAge: 60 * 10,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    console.error("Google login start failed", error);
    return setupHelpResponse("Google login could not start.");
  }
}

function setupHelpResponse(message: string) {
  return new NextResponse(
    `<!doctype html>
      <html>
        <head><title>Google login setup needed</title></head>
        <body style="font-family: system-ui, sans-serif; margin: 48px; color: #082f3f;">
          <h1>${message}</h1>
          <p>Add Google login environment variables in Render, redeploy, then try again.</p>
          <a href="/login">Back to login</a>
        </body>
      </html>`,
    { headers: { "Content-Type": "text/html" }, status: 409 },
  );
}

function safeNextPath(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
