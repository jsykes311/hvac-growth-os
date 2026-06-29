import { NextResponse } from "next/server";
import { syncHighLevelData } from "@/lib/server/highlevel";

export const runtime = "nodejs";

export async function POST() {
  try {
    const data = await syncHighLevelData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("HighLevel sync failed", error);
    return NextResponse.json(
      { error: "HighLevel is not ready to sync yet. Review HighLevel Setup and try again." },
      { status: 500 },
    );
  }
}
