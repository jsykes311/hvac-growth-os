import { NextRequest, NextResponse } from "next/server";
import {
  approvedUsersConfigured,
  createSessionToken,
  getApprovedUserByEmail,
  sessionCookieName,
  sessionMaxAgeSeconds,
} from "@/lib/auth";
import {
  GOOGLE_LOGIN_NEXT_COOKIE,
  GOOGLE_LOGIN_STATE_COOKIE,
  exchangeGoogleLoginCode,
} from "@/lib/server/google-login";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(GOOGLE_LOGIN_STATE_COOKIE)?.value || "";
  const nextPath = safeNextPath(request.cookies.get(GOOGLE_LOGIN_NEXT_COOKIE)?.value || "");

  if (!code || !state || !expectedState || state !== expectedState) {
    return callbackErrorResponse("Google sign-in could not be verified. Please try again.");
  }

  try {
    if (!approvedUsersConfigured()) {
      return callbackErrorResponse("HVAC Growth OS access has not been configured yet. Ask an admin to add approved users.");
    }

    const profile = await exchangeGoogleLoginCode({ code, origin: request.nextUrl.origin });
    if (!profile.emailVerified) {
      return callbackErrorResponse("Your Google email must be verified before it can access HVAC Growth OS.");
    }

    const user = getApprovedUserByEmail(profile.email);
    if (!user) {
      return callbackErrorResponse("This Google account is not approved for HVAC Growth OS.");
    }

    const response = NextResponse.redirect(new URL(nextPath || "/", request.nextUrl.origin));
    response.cookies.set(sessionCookieName(), await createSessionToken(user), {
      httpOnly: true,
      maxAge: sessionMaxAgeSeconds(),
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.delete(GOOGLE_LOGIN_STATE_COOKIE);
    response.cookies.delete(GOOGLE_LOGIN_NEXT_COOKIE);
    return response;
  } catch (error) {
    console.error("Google login callback failed", error);
    return callbackErrorResponse("Google sign-in could not be completed. Please try again.");
  }
}

function callbackErrorResponse(message: string) {
  return new NextResponse(
    `<!doctype html>
      <html>
        <head><title>Google sign-in needs review</title></head>
        <body style="font-family: system-ui, sans-serif; margin: 48px; color: #082f3f;">
          <h1>${message}</h1>
          <p>Return to the login screen and use an approved Google account.</p>
          <a href="/login">Back to login</a>
        </body>
      </html>`,
    { headers: { "Content-Type": "text/html" }, status: 401 },
  );
}

function safeNextPath(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
