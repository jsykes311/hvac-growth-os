import { NextResponse } from "next/server";
import { getStoredGoogleBusinessProfileData } from "@/lib/server/google-business-profile";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ data: await getStoredGoogleBusinessProfileData() });
  } catch (error) {
    console.error("Google Business Profile data load failed", error);
    return NextResponse.json(
      { error: "Google Business Profile data is not available yet. Complete setup and run a sync." },
      { status: 500 },
    );
  }
}
