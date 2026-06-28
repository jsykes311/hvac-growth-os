import { NextResponse } from "next/server";
import { getGoogleAdsConnectionStatus } from "@/lib/server/google-ads";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getGoogleAdsConnectionStatus());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Google Ads connection status." },
      { status: 500 },
    );
  }
}
