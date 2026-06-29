import { NextResponse } from "next/server";
import { getHighLevelConnectionStatus } from "@/lib/server/highlevel";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getHighLevelConnectionStatus());
  } catch (error) {
    console.error("HighLevel status load failed", error);
    return NextResponse.json(
      { error: "HighLevel setup status could not be loaded. Refresh Connected Apps and try again." },
      { status: 500 },
    );
  }
}
