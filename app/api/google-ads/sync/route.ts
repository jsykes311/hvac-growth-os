import { NextResponse } from "next/server";
import { syncGoogleAdsData } from "@/lib/server/google-ads";

export const runtime = "nodejs";

export async function POST() {
  try {
    const data = await syncGoogleAdsData();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sync Google Ads data." },
      { status: 500 },
    );
  }
}
