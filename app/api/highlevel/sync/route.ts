import { NextRequest, NextResponse } from "next/server";
import { HighLevelSyncError, syncHighLevelData } from "@/lib/server/highlevel";
import { recordComfortGuardiansHistoryEvent } from "@/lib/server/history-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { endDate?: unknown; startDate?: unknown } | null;
    const startDate = typeof body?.startDate === "string" ? body.startDate : undefined;
    const endDate = typeof body?.endDate === "string" ? body.endDate : undefined;
    const data = await syncHighLevelData({ endDate, startDate });
    await recordComfortGuardiansHistoryEvent({
      eventType: "highlevel_sync",
      metricDate: data.syncRange.endDate,
      payload: { data },
      source: "HighLevel",
      summary: {
        appointments: data.revenueFunnel.appointments,
        calls: data.revenueFunnel.phoneCalls,
        closedWonValue: data.revenueFunnel.closedWonValue,
        connectedLocation: data.connectedLocation,
        contacts: data.contacts.length,
        estimates: data.revenueFunnel.estimates,
        formsSubmitted: data.revenueFunnel.formsSubmitted,
        missedCalls: data.revenueFunnel.missedCalls,
        openPipelineValue: data.revenueFunnel.openPipelineValue,
        opportunities: data.opportunities.length,
        revenue: data.revenueFunnel.revenue,
        syncRange: data.syncRange,
        wonJobs: data.revenueFunnel.wonJobs,
      },
    });
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
