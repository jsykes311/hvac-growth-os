import { NextRequest, NextResponse } from "next/server";
import type { AnalyzedPage, BusinessProfile } from "@/lib/types";
import {
  comfortGuardiansClientId,
  comfortGuardiansUrl,
  getComfortGuardiansWorkspace,
  isComfortGuardiansUrl,
  saveComfortGuardiansWorkspace,
} from "@/lib/server/client-workspace-store";

export const runtime = "nodejs";

export async function GET() {
  const workspace = await getComfortGuardiansWorkspace();
  return NextResponse.json({
    clientId: comfortGuardiansClientId(),
    defaultUrl: comfortGuardiansUrl(),
    workspace,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      profile?: BusinessProfile;
      scrapedPages?: AnalyzedPage[];
      websiteUrl?: string;
    } | null;

    if (!body?.profile) {
      return NextResponse.json({ error: "Workspace profile is required." }, { status: 400 });
    }

    const websiteUrl = body.websiteUrl || comfortGuardiansUrl();
    if (!isComfortGuardiansUrl(websiteUrl)) {
      return NextResponse.json({ error: "This build only saves the Comfort Guardians workspace." }, { status: 400 });
    }

    const workspace = await saveComfortGuardiansWorkspace({
      profile: body.profile,
      scrapedPages: Array.isArray(body.scrapedPages) ? body.scrapedPages : [],
      websiteUrl,
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save workspace." },
      { status: 500 },
    );
  }
}
