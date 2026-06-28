import { NextResponse } from "next/server";
import { getStoredGoogleAdsData } from "@/lib/server/google-ads";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ data: await getStoredGoogleAdsData() });
  } catch (error) {
    console.error("Google Ads data load failed", error);
    return NextResponse.json(
      { error: "Google Ads data is not available yet. Complete setup and run a sync." },
      { status: 500 },
    );
  }
}
