import { NextRequest, NextResponse } from "next/server";
import { getComfortGuardiansHistory, getComfortGuardiansHistorySummary } from "@/lib/server/history-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") || 100);
    const [events, summary] = await Promise.all([
      getComfortGuardiansHistory(limit),
      getComfortGuardiansHistorySummary(),
    ]);
    return NextResponse.json({ events, summary });
  } catch (error) {
    console.error("History load failed", error);
    return NextResponse.json(
      { error: "Comfort Guardians history could not be loaded. Confirm DATABASE_URL is configured in Render." },
      { status: 500 },
    );
  }
}
