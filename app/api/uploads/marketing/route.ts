import { NextRequest, NextResponse } from "next/server";
import { getLatestMarketingPerformanceUploads, saveMarketingPerformanceUpload, type MarketingUploadSource } from "@/lib/server/manual-uploads";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const startDate = request.nextUrl.searchParams.get("startDate") || undefined;
    const endDate = request.nextUrl.searchParams.get("endDate") || undefined;
    return NextResponse.json({ uploads: await getLatestMarketingPerformanceUploads({ endDate, startDate }) });
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
    const body = (await request.json()) as {
      csv?: unknown;
      fileBase64?: unknown;
      fileName?: unknown;
      files?: unknown;
      metricDate?: unknown;
      source?: unknown;
    };
    const source = body.source === "google_ads" || body.source === "google_business_profile" ? body.source : null;
    if (!source) return NextResponse.json({ error: "Choose Google Ads or Google Business Profile before uploading." }, { status: 400 });
    const uploadedFiles = Array.isArray(body.files)
      ? body.files
        .map((file) => {
          if (!file || typeof file !== "object") return null;
          const item = file as { content?: unknown; fileName?: unknown };
          return typeof item.content === "string" && typeof item.fileName === "string"
            ? { content: item.content, fileName: item.fileName }
            : null;
        })
        .filter((file): file is { content: string; fileName: string } => Boolean(file))
      : [];
    const fileName = typeof body.fileName === "string" ? body.fileName : `${source}-performance.csv`;
    const isZip = /\.zip$/i.test(fileName);
    const uploadContent = isZip && typeof body.fileBase64 === "string" ? body.fileBase64 : body.csv;
    if (!uploadedFiles.length && (typeof uploadContent !== "string" || !uploadContent.trim())) return NextResponse.json({ error: "Upload CSV or ZIP files with performance rows." }, { status: 400 });

    const summary = await saveMarketingPerformanceUpload({
      csv: typeof uploadContent === "string" ? uploadContent : "",
      files: uploadedFiles,
      fileName,
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
