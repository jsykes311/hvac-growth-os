import { NextRequest, NextResponse } from "next/server";
import type { BusinessProfile, CampaignOutput } from "@/lib/types";
import { getStructuredJson } from "@/lib/server/openai";
import { campaignSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      profile?: BusinessProfile;
      goal?: unknown;
      offer?: unknown;
    } | null;

    if (!body?.profile) {
      throw new Error("Analyze a website before creating a campaign.");
    }

    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    const offer = typeof body.offer === "string" ? body.offer.trim() : "";

    if (!goal || !offer) {
      throw new Error("Choose a goal and enter an offer before creating a campaign.");
    }

    const campaign = await createCampaign(body.profile, goal, offer);
    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create a campaign." },
      { status: 500 },
    );
  }
}

async function createCampaign(profile: BusinessProfile, goal: string, offer: string) {
  return getStructuredJson<CampaignOutput>({
    name: "hvac_campaign_output",
    schema: campaignSchema,
    system:
      "You are an HVAC direct-response marketer. Create concise, practical campaign copy using only the provided business profile, goal, and offer. Preserve the brand tone and differentiators. Do not invent phone numbers, emails, services, areas, awards, financing, or emergency service claims.",
    user: [
      `Goal: ${goal}`,
      `Offer: ${offer}`,
      "Create campaign assets for this analyzed HVAC business profile.",
      "The landing page hero section should include a headline, subheadline, primary CTA, and exactly three supporting bullets.",
      "",
      JSON.stringify(profile, null, 2),
    ].join("\n"),
  });
}
