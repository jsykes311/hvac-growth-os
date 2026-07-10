import { NextResponse } from "next/server";
import { syncGoogleAdsData } from "@/lib/server/google-ads";
import { recordComfortGuardiansHistoryEvent } from "@/lib/server/history-store";

export const runtime = "nodejs";

export async function POST() {
  try {
    const data = await syncGoogleAdsData();
    await recordComfortGuardiansHistoryEvent({
      eventType: "google_ads_sync",
      payload: { data },
      source: "Google Ads",
      summary: {
        activeCustomerId: data.activeCustomerId,
        adGroups: data.adGroups.length,
        ads: data.ads.length,
        avgCpc: sumRows(data.campaigns, "clicks") ? sumRows(data.campaigns, "cost") / sumRows(data.campaigns, "clicks") : 0,
        budgets: data.budgets.length,
        campaigns: data.campaigns.length,
        clicks: sumRows(data.campaigns, "clicks"),
        conversions: sumRows(data.campaigns, "conversions"),
        cost: sumRows(data.campaigns, "cost"),
        impressions: sumRows(data.campaigns, "impressions"),
        keywords: data.keywords.length,
        searchTerms: data.searchTerms.length,
      },
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Google Ads sync failed", error);
    return NextResponse.json(
      { error: "Google Ads is not ready to sync yet. Review Google Ads Setup and try again." },
      { status: 500 },
    );
  }
}

function sumRows(rows: Array<{ clicks: number; cost: number; conversions: number; impressions: number }>, field: "clicks" | "cost" | "conversions" | "impressions") {
  return rows.reduce((total, row) => total + row[field], 0);
}
