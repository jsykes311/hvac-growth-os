import { NextRequest, NextResponse } from "next/server";
import type { BusinessProfile } from "@/lib/types";
import { scrapeSite } from "@/lib/server/firecrawl";
import { getStructuredJson } from "@/lib/server/openai";
import { businessProfileSchema } from "@/lib/server/schemas";
import { normalizeWebsiteUrl } from "@/lib/server/urls";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
    const websiteUrl = normalizeWebsiteUrl(body?.url);
    const scrapeResult = await scrapeSite(websiteUrl);
    const profile = await analyzeBusinessProfile(websiteUrl, scrapeResult);

    return NextResponse.json({ profile, scrapedPages: scrapeResult.pages.map(({ label, url, title }) => ({ label, url, title })) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to analyze this website." },
      { status: 500 },
    );
  }
}

async function analyzeBusinessProfile(
  websiteUrl: string,
  scrapeResult: Awaited<ReturnType<typeof scrapeSite>>,
) {
  const pageBundle = scrapeResult.pages
    .map((page) =>
      [
        `PAGE: ${page.label}`,
        `URL: ${page.url}`,
        `TITLE: ${page.title}`,
        "MARKDOWN:",
        page.markdown,
        "HTML/STYLING SAMPLE:",
        page.html,
      ].join("\n"),
    )
    .join("\n\n---\n\n");

  return getStructuredJson<BusinessProfile>({
    name: "hvac_business_profile",
    schema: businessProfileSchema,
    system:
      "You are a senior HVAC growth strategist and brand analyst. Extract facts only when supported by the scraped website content. If a field is not found, use an empty string or empty array. Score growth potential based on conversion clarity, service-area SEO, offer strength, proof, emergency positioning, financing, and maintenance-plan visibility.",
    user: [
      `Analyze this HVAC contractor website: ${websiteUrl}`,
      "Return a complete business profile using the required schema.",
      "Brand analysis instructions:",
      "- Infer primary, secondary, and accent colors from Firecrawl branding data when present, then CSS/html styles if needed.",
      "- Use full absolute URL for logoUrl when a logo is found; otherwise return an empty string.",
      "- Use full absolute URL for heroImageUrl when a relevant website hero, Open Graph, service, or team photo is found; otherwise return an empty string.",
      "- brandStyle should summarize the visual identity, layout, imagery, and tone in one concise sentence.",
      "- topGrowthOpportunities must contain exactly five specific, actionable opportunities.",
      "",
      `Firecrawl branding JSON:\n${JSON.stringify(scrapeResult.branding ?? {}, null, 2)}`,
      "",
      pageBundle,
    ].join("\n"),
  });
}
