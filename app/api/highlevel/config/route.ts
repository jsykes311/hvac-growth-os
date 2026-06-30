import { NextRequest, NextResponse } from "next/server";
import { HighLevelSyncError, saveHighLevelPrivateIntegrationConfig } from "@/lib/server/highlevel";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { locationId?: unknown; privateIntegrationToken?: unknown } | null;
    const locationId = typeof body?.locationId === "string" ? body.locationId : "";
    const privateIntegrationToken = typeof body?.privateIntegrationToken === "string" ? body.privateIntegrationToken : "";
    const status = await saveHighLevelPrivateIntegrationConfig({ locationId, privateIntegrationToken });
    return NextResponse.json(status);
  } catch (error) {
    console.error("HighLevel config save failed", error);
    if (error instanceof HighLevelSyncError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "HighLevel setup could not be saved. Check the location ID and private integration token, then try again." },
      { status: 500 },
    );
  }
}
