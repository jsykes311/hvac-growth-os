import { NextRequest, NextResponse } from "next/server";
import {
  approvedUsersConfigured,
  authenticateApprovedUser,
  createSessionToken,
  sessionCookieName,
  sessionMaxAgeSeconds,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!approvedUsersConfigured()) {
      return NextResponse.json(
        { error: "HVAC Growth OS access has not been configured yet. Ask an admin to add approved users." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const user = await authenticateApprovedUser(email, password);

    if (!user) {
      return NextResponse.json({ error: "The email or password is not approved for HVAC Growth OS." }, { status: 401 });
    }

    const response = NextResponse.json({
      user: {
        clientIds: user.clientIds ?? [],
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
    response.cookies.set(sessionCookieName(), await createSessionToken(user), {
      httpOnly: true,
      maxAge: sessionMaxAgeSeconds(),
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Unable to sign in right now. Please try again." }, { status: 500 });
  }
}
