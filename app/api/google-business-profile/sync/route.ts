import { NextResponse } from "next/server";
import { syncGoogleBusinessProfileData } from "@/lib/server/google-business-profile";

export const runtime = "nodejs";

export async function POST() {
  try {
    return NextResponse.json({ data: await syncGoogleBusinessProfileData() });
  } catch (error) {
    console.error("Google Business Profile sync failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Google Business Profile sync could not be completed. Review setup and try again." },
      { status: 500 },
    );
  }
}
