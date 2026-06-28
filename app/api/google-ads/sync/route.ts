import { NextResponse } from "next/server";
import { syncGoogleAdsData } from "@/lib/server/google-ads";

export const runtime = "nodejs";

export async function POST() {
  try {
    const data = await syncGoogleAdsData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Google Ads sync failed", error);
    return NextResponse.json(
      { error: "Google Ads is not ready to sync yet. Review Google Ads Setup and try again." },
      { status: 500 },
    );
  }
}
