import { NextRequest, NextResponse } from "next/server";
import type { AnalyzedPage, BusinessProfile, PpcManualOverrides } from "@/lib/types";
import { createPpcPlan } from "@/lib/server/ppc";
import { normalizeWebsiteUrl } from "@/lib/server/urls";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      profile?: BusinessProfile;
      scrapedPages?: AnalyzedPage[];
      url?: unknown;
      overrides?: PpcManualOverrides;
    } | null;

    if (!body?.profile) {
      throw new Error("Analyze a website before creating a PPC plan.");
    }

    const websiteUrl = normalizeWebsiteUrl(body.url);
    const plan = createPpcPlan({
      profile: body.profile,
      websiteUrl,
      scrapedPages: Array.isArray(body.scrapedPages) ? body.scrapedPages : [],
      overrides: sanitizeOverrides(body.overrides),
    });

    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create a PPC plan." },
      { status: 500 },
    );
  }
}

function sanitizeOverrides(overrides: PpcManualOverrides | undefined): PpcManualOverrides {
  if (!overrides) return {};

  return {
    businessName: cleanString(overrides.businessName),
    phoneNumber: cleanString(overrides.phoneNumber),
    serviceCities: cleanStringList(overrides.serviceCities),
    monthlyBudget: normalizeNumber(overrides.monthlyBudget),
    averageRepairTicket: normalizeNumber(overrides.averageRepairTicket),
    averageReplacementTicket: normalizeNumber(overrides.averageReplacementTicket),
    estimatedCloseRate: normalizeNumber(overrides.estimatedCloseRate),
    estimatedLeadToEstimateRate: normalizeNumber(overrides.estimatedLeadToEstimateRate),
    servicesToPrioritize: cleanStringList(overrides.servicesToPrioritize),
    emergencyService: normalizeBoolean(overrides.emergencyService),
    financing: normalizeBoolean(overrides.financing),
    freeEstimates: normalizeBoolean(overrides.freeEstimates),
    licensedAndInsured: normalizeBoolean(overrides.licensedAndInsured),
    broadMatchEnabled: Boolean(overrides.broadMatchEnabled),
  };
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function cleanStringList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : undefined;
}

function normalizeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}
