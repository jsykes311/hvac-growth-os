import { NextResponse } from "next/server";
import { getStoredGoogleAdsData } from "@/lib/server/google-ads";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ data: await getStoredGoogleAdsData() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Google Ads data." },
      { status: 500 },
    );
  }
}
