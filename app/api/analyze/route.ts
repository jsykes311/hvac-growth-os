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
    const profile = sanitizeBusinessProfile(await analyzeBusinessProfile(websiteUrl, scrapeResult));

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
      "You are a senior HVAC growth strategist. Write for contractors and owners, not technical marketers. Use plain language, avoid jargon, and explain every recommendation in terms of booked calls, trust, local visibility, and clearer homeowner messaging. Extract facts only when supported by the scraped website content. If a field is not found, use an empty string or empty array. Score growth potential based on conversion clarity, service-area search visibility, offer strength, proof, emergency positioning, financing, maintenance-plan visibility, and AI-search answerability.",
    user: [
      `Analyze this HVAC contractor website: ${websiteUrl}`,
      "Return a complete business profile using the required JSON shape.",
      "Important writing style: all visible recommendation text should be understandable to an HVAC contractor. Do not use terms like schema, entity, citation, metadata, SERP, or structured data in returned copy. Say what to add or fix and why it helps homeowners, Google, or AI tools understand the company.",
      "Brand analysis instructions:",
      "- Infer primary, secondary, and accent colors from Firecrawl branding data when present, then CSS/html styles if needed.",
      "- Use full absolute URL for logoUrl when a logo is found; otherwise return an empty string.",
      "- Use full absolute URL for heroImageUrl when a relevant website hero, Open Graph, service, or team photo is found; otherwise return an empty string.",
      "- Ignore parked-domain, domain-sale, marketplace, registrar, ad-network, or unrelated third-party branding such as Afternic, Sedo, Dan.com, GoDaddy parking pages, BuyDomains, and HugeDomains.",
      "- brandStyle should summarize the visual identity, layout, imagery, and tone in one concise sentence.",
      "- topGrowthOpportunities must contain exactly five specific, actionable opportunities.",
      "Google/local search analysis instructions:",
      "- seoAnalysis.score should rate how ready the site is to get found by local homeowners on Google from 0 to 100.",
      "- titleTag and metaDescription should reflect what appears in the scraped HTML/title content when present; otherwise use an empty string.",
      "- localSeoGaps should identify missing or weak location, service, GBP, review, internal-linking, NAP, and city/service-page signals.",
      "- technicalIssues should flag visible website/content issues from the scraped HTML only, such as missing headings, thin content, weak page titles, missing machine-readable business details, or unclear CTAs. Phrase these as plain website fixes.",
      "- contentOpportunities should list practical service, location, comparison, maintenance, financing, emergency, and seasonal content opportunities.",
      "- keywordUpdates should include 3 to 6 specific wording changes for existing pages. Each item should say the current weak wording if visible, the better homeowner search phrase to use, the page/section to update, and why it helps. Focus on phrases like 'AC repair in [city]', 'furnace installation near [city]', 'emergency HVAC service', 'heat pump repair', 'HVAC financing', and service-area wording. Do not recommend keyword stuffing.",
      "- recommendedPages should include 3 to 6 local page recommendations with priority, slug, homeowner need, and rationale.",
      "- seoAnalysis.recommendedFixes should include 3 to 6 implementation-ready fixes mapped to the local search problems found. Each fix needs a problem, fix, priority, impact, and effort.",
      "AI search analysis instructions:",
      "- aiSeoAnalysis.score should rate readiness to be understood and recommended by AI tools from 0 to 100.",
      "- answerEngineReadiness should summarize whether the site gives direct, easy-to-understand answers about services, locations, pricing/financing, proof, and process.",
      "- citationOpportunities should identify proof, facts, or explanations the company should add so AI tools can confidently quote or summarize it.",
      "- schemaRecommendations should recommend plain-language website updates that make business details, services, offers, reviews, FAQs, and service areas clearer to Google and AI tools. Do not mention schema or structured data in the returned text.",
      "- faqQuestions should contain practical homeowner questions the business should answer directly on service/location pages.",
      "- entityGaps should identify missing trust details like owner/team, license numbers, review proof, service-area specificity, brands served, warranties, and payment options. Do not use the word entity in returned text.",
      "- aiSeoAnalysis.recommendedFixes should include 3 to 6 implementation-ready fixes mapped to AI search problems found. Each fix needs a problem, fix, priority, impact, and effort.",
      "",
      `Firecrawl branding JSON:\n${JSON.stringify(scrapeResult.branding ?? {}, null, 2)}`,
      "",
      pageBundle,
    ].join("\n"),
  });
}

const PARKED_DOMAIN_TERMS = [
  "afternic",
  "buydomains",
  "dan.com",
  "domainmarket",
  "godaddy.com/forsale",
  "hugedomains",
  "sedo",
];

function sanitizeBusinessProfile(profile: BusinessProfile): BusinessProfile {
  return {
    ...profile,
    companyName: cleanText(profile.companyName),
    phone: cleanText(profile.phone),
    email: cleanText(profile.email),
    services: cleanList(profile.services),
    serviceAreas: cleanList(profile.serviceAreas),
    brandTone: cleanText(profile.brandTone),
    differentiators: cleanList(profile.differentiators),
    topGrowthOpportunities: cleanList(profile.topGrowthOpportunities).slice(0, 5),
    logoUrl: cleanUrl(profile.logoUrl),
    heroImageUrl: cleanUrl(profile.heroImageUrl),
    brandStyle: cleanText(profile.brandStyle),
    seoAnalysis: sanitizeSeoAnalysis(profile.seoAnalysis),
    aiSeoAnalysis: sanitizeAiSeoAnalysis(profile.aiSeoAnalysis),
  };
}

function sanitizeSeoAnalysis(analysis: BusinessProfile["seoAnalysis"]): BusinessProfile["seoAnalysis"] {
  return {
    score: clampScore(analysis?.score),
    titleTag: cleanText(analysis?.titleTag ?? ""),
    metaDescription: cleanText(analysis?.metaDescription ?? ""),
    localSeoGaps: cleanList(analysis?.localSeoGaps ?? []),
    technicalIssues: cleanList(analysis?.technicalIssues ?? []),
    contentOpportunities: cleanList(analysis?.contentOpportunities ?? []),
    keywordUpdates: sanitizeKeywordUpdates(analysis?.keywordUpdates ?? []),
    recommendedFixes: sanitizeFixes(analysis?.recommendedFixes ?? []),
    recommendedPages: (analysis?.recommendedPages ?? [])
      .map((page) => ({
        title: cleanText(page.title),
        slug: cleanText(page.slug),
        searchIntent: cleanText(page.searchIntent),
        priority: ["High", "Medium", "Low"].includes(page.priority) ? page.priority : "Medium",
        rationale: cleanText(page.rationale),
      }))
      .filter((page) => page.title || page.slug || page.rationale)
      .slice(0, 6),
  };
}

function sanitizeKeywordUpdates(updates: BusinessProfile["seoAnalysis"]["keywordUpdates"]) {
  return updates
    .map((update) => ({
      currentText: cleanText(update.currentText),
      suggestedText: cleanText(update.suggestedText),
      page: cleanText(update.page),
      reason: cleanText(update.reason),
    }))
    .filter((update) => update.suggestedText || update.reason)
    .slice(0, 6);
}

function sanitizeAiSeoAnalysis(analysis: BusinessProfile["aiSeoAnalysis"]): BusinessProfile["aiSeoAnalysis"] {
  return {
    score: clampScore(analysis?.score),
    answerEngineReadiness: cleanText(analysis?.answerEngineReadiness ?? ""),
    citationOpportunities: cleanList(analysis?.citationOpportunities ?? []),
    schemaRecommendations: cleanList(analysis?.schemaRecommendations ?? []),
    faqQuestions: cleanList(analysis?.faqQuestions ?? []),
    entityGaps: cleanList(analysis?.entityGaps ?? []),
    recommendedFixes: sanitizeFixes(analysis?.recommendedFixes ?? []),
  };
}

function sanitizeFixes(fixes: BusinessProfile["seoAnalysis"]["recommendedFixes"]) {
  return fixes
    .map((fix) => ({
      problem: cleanText(fix.problem),
      fix: cleanText(fix.fix),
      priority: ["High", "Medium", "Low"].includes(fix.priority) ? fix.priority : "Medium",
      impact: cleanText(fix.impact),
      effort: ["Quick", "Moderate", "Heavy"].includes(fix.effort) ? fix.effort : "Moderate",
    }))
    .filter((fix) => fix.problem || fix.fix)
    .slice(0, 6);
}

function clampScore(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function cleanList(values: string[]) {
  return values.map(cleanText).filter(Boolean);
}

function cleanText(value: string) {
  return hasParkedDomainArtifact(value) ? "" : value;
}

function cleanUrl(value: string) {
  return hasParkedDomainArtifact(value) ? "" : value;
}

function hasParkedDomainArtifact(value: string) {
  const normalized = value.toLowerCase();
  return PARKED_DOMAIN_TERMS.some((term) => normalized.includes(term));
}
