import { NextRequest, NextResponse } from "next/server";
import type { BusinessProfile, CampaignOutput } from "@/lib/types";
import { createCampaignImage } from "@/lib/server/creative/campaign-image";
import { generatePngImage, getStructuredJson } from "@/lib/server/openai";
import { campaignSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const maxDuration = 120;

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
    const generatedHeroImageDataUrl = await createGeneratedHeroImage(body.profile, campaign, goal, offer);
    const campaignImage = await createCampaignImage({
      profile: body.profile,
      campaign,
      goal,
      offer,
      generatedHeroImageDataUrl,
    });

    return NextResponse.json({ campaign, campaignImage });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create a campaign." },
      { status: 500 },
    );
  }
}

async function createGeneratedHeroImage(
  profile: BusinessProfile,
  campaign: CampaignOutput,
  goal: string,
  offer: string,
) {
  try {
    return await generatePngImage({
      prompt: buildHeroImagePrompt(profile, campaign, goal, offer),
      size: "1536x1024",
    });
  } catch (error) {
    console.error("Campaign hero image generation failed", error);
    return "";
  }
}

function buildHeroImagePrompt(
  profile: BusinessProfile,
  campaign: CampaignOutput,
  goal: string,
  offer: string,
) {
  const service = profile.services[0] || "HVAC service";
  const area = profile.serviceAreas[0] || "a local neighborhood";
  const primaryColor = profile.primaryColor || "brand primary color";
  const accentColor = profile.accentColor || "brand accent color";

  return [
    "Create a realistic premium HVAC advertising hero photo in the same polished contractor-marketing style as a Microf campaign hero image.",
    `Scene: a professional HVAC contractor on the right side of a residential street near a clean suburban home, outdoor condenser, and service van in ${area}.`,
    `Campaign goal: ${goal}. Offer context: ${offer}. Main service: ${service}.`,
    `Mood and brand tone: ${profile.brandTone || "trustworthy, professional, local, helpful"}.`,
    `Use subtle wardrobe, van, lighting, or environmental accents inspired by these brand colors: primary ${primaryColor}, accent ${accentColor}.`,
    `The image should support this landing page message: ${campaign.landingPageHero.headline}`,
    "Composition: 16:9 horizontal hero photo. Keep the contractor on the right third, full head visible with generous headroom, shown from head to at least mid-thigh, carrying a tool bag or tablet.",
    "Leave the left half intentionally uncluttered and slightly darker for large headline text and proof-point overlays. Do not put the face or important objects under the left text area.",
    "Lighting: premium golden-hour commercial photography, crisp realistic detail, confident but believable pose, local-homeowner trust, no exaggerated action pose.",
    "Do not include any readable text, logos, badges, watermarks, fake brand names, signage, UI elements, distorted hands, distorted faces, or malformed tools.",
  ].join("\n");
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
      "The SEO page recommendation should be one practical local SEO page idea with service, location, search intent, and suggested page angle.",
      "The AI SEO recommendation should be one practical answer-engine content asset, FAQ cluster, schema addition, or citation-building move that helps AI systems confidently summarize and recommend the business.",
      "",
      JSON.stringify(profile, null, 2),
    ].join("\n"),
  });
}
