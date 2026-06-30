import { NextResponse } from "next/server";
import { HighLevelSyncError, syncHighLevelData } from "@/lib/server/highlevel";

export const runtime = "nodejs";

export async function POST() {
  try {
    const data = await syncHighLevelData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("HighLevel sync failed", error);
    if (error instanceof HighLevelSyncError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "HighLevel is not ready to sync yet. Review HighLevel Setup and try again." },
      { status: 500 },
    );
  }
}
