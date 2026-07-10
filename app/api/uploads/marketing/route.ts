import { NextRequest, NextResponse } from "next/server";
import { getLatestMarketingPerformanceUploads, saveMarketingPerformanceUpload, type MarketingUploadSource } from "@/lib/server/manual-uploads";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ uploads: await getLatestMarketingPerformanceUploads() });
  } catch (error) {
    console.error("Marketing uploads load failed", error);
    return NextResponse.json(
      { error: "Uploaded performance data is not available yet. Upload a Google Ads or Google Business Profile CSV when ready." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { csv?: unknown; fileName?: unknown; metricDate?: unknown; source?: unknown };
    const source = body.source === "google_ads" || body.source === "google_business_profile" ? body.source : null;
    if (!source) return NextResponse.json({ error: "Choose Google Ads or Google Business Profile before uploading." }, { status: 400 });
    if (typeof body.csv !== "string" || !body.csv.trim()) return NextResponse.json({ error: "Upload a CSV file with performance rows." }, { status: 400 });

    const summary = await saveMarketingPerformanceUpload({
      csv: body.csv,
      fileName: typeof body.fileName === "string" ? body.fileName : `${source}-performance.csv`,
      metricDate: typeof body.metricDate === "string" ? body.metricDate : undefined,
      source: source as MarketingUploadSource,
    });

    return NextResponse.json({ summary, uploads: await getLatestMarketingPerformanceUploads() });
  } catch (error) {
    console.error("Marketing upload failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The CSV could not be processed. Check the file and try again." },
      { status: 400 },
    );
  }
}
