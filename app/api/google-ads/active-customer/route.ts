import { NextRequest, NextResponse } from "next/server";
import { setActiveGoogleAdsCustomer } from "@/lib/server/google-ads";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { customerId?: unknown } | null;
    const customerId = typeof body?.customerId === "string" ? body.customerId : "";
    await setActiveGoogleAdsCustomer(customerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Google Ads active customer selection failed", error);
    return NextResponse.json(
      { error: "That Google Ads account could not be selected. Refresh the account list and try again." },
      { status: 500 },
    );
  }
}
