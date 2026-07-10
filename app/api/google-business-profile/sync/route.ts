import { NextResponse } from "next/server";
import { syncGoogleBusinessProfileData } from "@/lib/server/google-business-profile";
import { recordComfortGuardiansHistoryEvent } from "@/lib/server/history-store";

export const runtime = "nodejs";

export async function POST() {
  try {
    const data = await syncGoogleBusinessProfileData();
    await recordComfortGuardiansHistoryEvent({
      eventType: "google_business_profile_sync",
      payload: { data },
      source: "Google Business Profile",
      summary: {
        accounts: data.accounts.length,
        activeAccountId: data.activeAccountId,
        activeLocationId: data.activeLocationId,
        averageRating: data.averageRating,
        locations: data.locations.length,
        posts: data.posts.length,
        reviews: data.reviews.length,
        syncAlerts: data.syncAlerts.slice(0, 5),
      },
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Google Business Profile sync failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Google Business Profile sync could not be completed. Review setup and try again." },
      { status: 500 },
    );
  }
}
