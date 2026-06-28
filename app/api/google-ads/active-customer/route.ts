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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to select Google Ads customer account." },
      { status: 500 },
    );
  }
}
