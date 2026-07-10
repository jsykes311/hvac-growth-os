import { NextResponse } from "next/server";
import { getGoogleBusinessProfileConnectionStatus } from "@/lib/server/google-business-profile";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getGoogleBusinessProfileConnectionStatus());
  } catch (error) {
    console.error("Google Business Profile status load failed", error);
    return NextResponse.json(
      { error: "Google Business Profile setup status could not be loaded. Refresh Connected Apps and try again." },
      { status: 500 },
    );
  }
}
