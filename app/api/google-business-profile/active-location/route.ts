import { NextRequest, NextResponse } from "next/server";
import { setActiveGoogleBusinessProfileLocation } from "@/lib/server/google-business-profile";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { accountId?: unknown; locationId?: unknown } | null;
    const accountId = typeof body?.accountId === "string" ? body.accountId : "";
    const locationId = typeof body?.locationId === "string" ? body.locationId : "";
    await setActiveGoogleBusinessProfileLocation({ accountId, locationId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Google Business Profile active location selection failed", error);
    return NextResponse.json(
      { error: "That Google Business Profile location could not be selected. Refresh the profile list and try again." },
      { status: 400 },
    );
  }
}
