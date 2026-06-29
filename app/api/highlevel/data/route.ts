import { NextResponse } from "next/server";
import { getStoredHighLevelData } from "@/lib/server/highlevel";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ data: await getStoredHighLevelData() });
  } catch (error) {
    console.error("HighLevel data load failed", error);
    return NextResponse.json(
      { error: "HighLevel data is not available yet. Complete setup and run a sync." },
      { status: 500 },
    );
  }
}
