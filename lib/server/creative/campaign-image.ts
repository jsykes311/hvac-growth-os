import type { BusinessProfile, CampaignImage, CampaignOutput } from "@/lib/types";

type CreativeInput = {
  profile: BusinessProfile;
  campaign: CampaignOutput;
  goal: string;
  offer: string;
};

const WIDTH = 1200;
const HEIGHT = 1800;

export async function createCampaignImage({
  profile,
  campaign,
  goal,
  offer,
}: CreativeInput): Promise<CampaignImage> {
  const logoDataUrl = await fetchLogoAsDataUrl(profile.logoUrl);
  const primary = normalizeColor(profile.primaryColor, "#0f8f45");
  const accent = chooseActionColor(profile.accentColor, primary);
  const company = profile.companyName || "Local HVAC Pros";
  const phone = profile.phone || "";
  const email = profile.email || "";
  const serviceArea = profile.serviceAreas[0] || "your area";
  const topService = profile.services[0] || "HVAC service";
  const differentiators = nonEmpty(profile.differentiators, [
    "Fast scheduling",
    "Clear recommendations",
    "Local technicians",
    "Comfort-focused service",
  ]).slice(0, 4);
  const opportunity = profile.topGrowthOpportunities[0] || "Turn every homeowner visit into a clear next step.";
  const proofCards = buildProofCards(profile);
  const heroHeadline = campaign.landingPageHero.headline || "Finish Busy Season Strong.";
  const heroLines = wrapText(heroHeadline, 18, 4);
  const introLines = wrapText(campaign.landingPageHero.subheadline, 54, 3);
  const quoteLines = wrapText(
    `${campaign.landingPageHero.headline} ${offer ? `with ${offer}` : ""}`,
    32,
    4,
  );
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="hero" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="#07110d"/>
      <stop offset="48%" stop-color="#111a18" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="${escapeXml(tint(primary, 72))}"/>
    </linearGradient>
    <linearGradient id="heroGlow" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${escapeXml(primary)}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${escapeXml(accent)}" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="pageShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#1f2a22" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#e8ede5"/>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" filter="url(#pageShadow)"/>

  <rect x="0" y="0" width="${WIDTH}" height="515" fill="url(#hero)"/>
  <rect x="0" y="0" width="${WIDTH}" height="515" fill="url(#heroGlow)"/>
  <path d="M650 504 L1200 504 L1200 0 C1070 58 992 132 922 223 C842 326 760 414 650 504 Z" fill="#ffffff" opacity="0.08"/>
  ${renderHeroScene(primary, accent)}
  ${renderLogoMark(logoDataUrl, company, primary)}
  ${renderHeroText(heroLines, introLines, primary)}

  ${renderTopBenefitStrip(proofCards, primary)}
  ${renderIntroSection(goal, opportunity, campaign.landingPageHero, primary)}
  ${renderDifferentiatorCards(differentiators, primary)}
  ${renderBlackBand(company, campaign.landingPageHero.subheadline, primary)}
  ${renderCtaBand(campaign.landingPageHero.primaryCta, offer, primary)}
  ${renderFooter(logoDataUrl, company, phone, email, serviceArea, topService, primary)}
</svg>`.trim();

  return {
    dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    fileName: `${slugify(company)}-campaign-onepager.svg`,
    format: "svg",
    width: WIDTH,
    height: HEIGHT,
  };
}

async function fetchLogoAsDataUrl(logoUrl: string) {
  if (!logoUrl) return "";

  try {
    const parsed = new URL(logoUrl);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    const response = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return "";
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      return "";
    }

    const bytes = Buffer.from(await response.arrayBuffer());

    if (bytes.byteLength > 800000) {
      return "";
    }

    return `data:${contentType};base64,${bytes.toString("base64")}`;
  } catch {
    return "";
  }
}

function renderHeroScene(primary: string, accent: string) {
  return `
  <g opacity="0.92">
    <rect x="735" y="70" width="325" height="235" rx="4" fill="${escapeXml(tint(primary, 80))}" opacity="0.55"/>
    <path d="M694 210 L898 62 L1104 210" fill="none" stroke="#f4efe7" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
    <path d="M742 210 V395 H1060 V210" fill="none" stroke="#f4efe7" stroke-width="16" opacity="0.75"/>
    <rect x="1034" y="242" width="96" height="108" rx="10" fill="#1b2522" opacity="0.62"/>
    <path d="M1050 265 H1114 M1050 292 H1114 M1050 319 H1114" stroke="${escapeXml(tint(primary, 60))}" stroke-width="5" opacity="0.8"/>
    <circle cx="1082" cy="296" r="22" fill="none" stroke="${escapeXml(primary)}" stroke-width="6"/>
    <rect x="610" y="292" width="146" height="86" rx="8" fill="#d8d5cd" opacity="0.72"/>
    <circle cx="634" cy="382" r="18" fill="#0d1210"/>
    <circle cx="728" cy="382" r="18" fill="#0d1210"/>
    <rect x="650" y="250" width="62" height="42" rx="4" fill="#17211e" opacity="0.86"/>
    <path d="M500 464 C612 385 722 505 840 428 C932 368 1038 382 1135 438" fill="none" stroke="#ffffff" stroke-width="7" opacity="0.22"/>
    <circle cx="902" cy="122" r="110" fill="${escapeXml(accent)}" opacity="0.1"/>
  </g>`;
}

function renderLogoMark(logoDataUrl: string, company: string, primary: string) {
  if (logoDataUrl) {
    return `
  <rect x="58" y="56" width="305" height="92" rx="6" fill="#ffffff" opacity="0.94"/>
  <image href="${escapeXml(logoDataUrl)}" x="82" y="76" width="257" height="52" preserveAspectRatio="xMinYMid meet"/>`;
  }

  const short = company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  return `
  <text x="58" y="122" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="950" fill="${escapeXml(primary)}">${escapeXml(short)}</text>
  <text x="62" y="150" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900" fill="${escapeXml(tint(primary, 35))}" letter-spacing="1.5">HVAC EXPERTISE</text>`;
}

function renderHeroText(headlineLines: string[], introLines: string[], primary: string) {
  const accentLineIndex = Math.max(0, headlineLines.length - 1);
  const headline = headlineLines
    .map((line, index) => {
      const fill = index === accentLineIndex ? primary : "#ffffff";
      return `<text x="58" y="${220 + index * 56}" font-family="Inter, Arial, sans-serif" font-size="57" font-weight="950" fill="${escapeXml(fill)}">${escapeXml(line)}</text>`;
    })
    .join("\n  ");

  return `
  ${headline}
  ${renderTextLines(introLines, 58, 405, 20, 29, "#ffffff", 650)}`;
}

function renderTopBenefitStrip(cards: Array<{ title: string; body: string }>, primary: string) {
  const cardWidth = WIDTH / 4;

  return `
  <g>
    <rect x="0" y="515" width="${WIDTH}" height="142" fill="#f8f9f6"/>
    ${cards
      .slice(0, 4)
      .map((card, index) => {
        const x = index * cardWidth;
        return `
    <line x1="${x}" y1="515" x2="${x}" y2="657" stroke="#d9ded5"/>
    <text x="${x + 28}" y="560" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="950" fill="${escapeXml(primary)}">${escapeXml(card.title)}</text>
    ${renderTextLines(wrapText(card.body, 30, 2), x + 28, 587, 14, 23, "#555d55", 500)}`;
      })
      .join("\n")}
  </g>`;
}

function renderIntroSection(
  goal: string,
  opportunity: string,
  hero: CampaignOutput["landingPageHero"],
  primary: string,
) {
  const bodyLines = wrapText(opportunity, 56, 3);
  const quoteLines = wrapText(hero.headline, 26, 4);

  return `
  <g>
    <rect x="0" y="657" width="${WIDTH}" height="230" fill="#ffffff"/>
    <text x="58" y="717" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="950" fill="${escapeXml(primary)}" letter-spacing="3">${escapeXml(goal.toUpperCase())}</text>
    ${renderTextLines(bodyLines, 58, 760, 22, 32, "#232a25", 500)}
    <rect x="668" y="700" width="430" height="138" fill="#f4f6f2"/>
    <rect x="668" y="700" width="5" height="138" fill="${escapeXml(primary)}"/>
    ${renderTextLines(quoteLines, 698, 750, 29, 35, "#111815", 950, primary)}
  </g>`;
}

function renderDifferentiatorCards(items: string[], primary: string) {
  const cards = items.slice(0, 4);

  return `
  <g>
    <rect x="0" y="887" width="${WIDTH}" height="214" fill="#ffffff"/>
    ${cards
      .map((item, index) => {
        const x = 58 + index * 268;
        const lines = wrapText(item, 24, 4);
        return `
    <rect x="${x}" y="932" width="238" height="140" fill="#ffffff" stroke="#d8ded5"/>
    <text x="${x + 22}" y="972" font-family="Inter, Arial, sans-serif" font-size="19" font-weight="950" fill="#101512">${escapeXml(lines[0] ?? "Growth lever")}</text>
    ${renderTextLines(lines.slice(1), x + 22, 1004, 15, 23, "#596159", 500)}
    <rect x="${x + 22}" y="1040" width="54" height="4" fill="${escapeXml(primary)}"/>`;
      })
      .join("\n")}
  </g>`;
}

function renderBlackBand(company: string, body: string, primary: string) {
  return `
  <g>
    <rect x="58" y="1136" width="1084" height="218" fill="#08100c"/>
    <text x="94" y="1198" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="950" fill="#ffffff">Make every homeowner conversation</text>
    <text x="94" y="1238" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="950" fill="#ffffff">a growth opportunity.</text>
    ${renderTextLines(wrapText(`${company} can use this offer to move more homeowners from interest to booked appointments. ${body}`, 108, 3), 94, 1286, 17, 28, "#d9dfd8", 500)}
    <rect x="94" y="1318" width="144" height="5" fill="${escapeXml(primary)}"/>
  </g>`;
}

function renderCtaBand(cta: string, offer: string, primary: string) {
  return `
  <g>
    <rect x="0" y="1410" width="${WIDTH}" height="132" fill="${escapeXml(primary)}"/>
    <text x="58" y="1478" font-family="Inter, Arial, sans-serif" font-size="31" font-weight="950" fill="#ffffff">${escapeXml(offer || "Ready-to-book comfort campaign")}</text>
    <text x="58" y="1510" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="600" fill="#ffffff" opacity="0.9">Use the analyzed profile to launch a campaign that feels local, relevant, and easy to act on.</text>
    <rect x="872" y="1455" width="250" height="54" rx="27" fill="none" stroke="#ffffff" opacity="0.65"/>
    <text x="997" y="1489" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="950" text-anchor="middle" fill="#ffffff">${escapeXml(cta)}</text>
  </g>`;
}

function renderFooter(
  logoDataUrl: string,
  company: string,
  phone: string,
  email: string,
  serviceArea: string,
  topService: string,
  primary: string,
) {
  return `
  <g>
    <rect x="0" y="1542" width="${WIDTH}" height="258" fill="#ffffff"/>
    ${logoDataUrl ? `<image href="${escapeXml(logoDataUrl)}" x="58" y="1620" width="180" height="66" preserveAspectRatio="xMinYMid meet"/>` : `<text x="58" y="1664" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="950" fill="${escapeXml(primary)}">${escapeXml(company.slice(0, 16))}</text>`}
    <rect x="284" y="1588" width="4" height="120" fill="${escapeXml(primary)}"/>
    <text x="315" y="1610" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="950" fill="${escapeXml(primary)}">${escapeXml(company)}</text>
    <text x="315" y="1642" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="800" fill="#171d19">${escapeXml(topService)} in ${escapeXml(serviceArea)}</text>
    <text x="315" y="1684" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" fill="#171d19">${escapeXml(phone || email || "Contact for booking")}</text>
    <text x="315" y="1714" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="500" fill="#4f5a52">${escapeXml(email)}</text>
    <text x="58" y="1770" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="500" fill="#6f776f">Campaign creative generated from public website analysis. Offer terms and availability should be verified before launch.</text>
  </g>`;
}

function buildProofCards(profile: BusinessProfile) {
  return [
    {
      title: profile.financingMentioned ? "Financing ready" : "Clear offers",
      body: profile.financingMentioned
        ? "Promote payment options when homeowners are weighing replacement decisions."
        : "Lead with a simple offer homeowners can understand quickly.",
    },
    {
      title: profile.emergencyServiceMentioned ? "Emergency demand" : "Fast decisions",
      body: profile.emergencyServiceMentioned
        ? "Turn urgent repair searches into booked calls with direct messaging."
        : "Help homeowners move from problem to appointment without friction.",
    },
    {
      title: profile.maintenancePlanMentioned ? "Plan revenue" : "Repeat demand",
      body: profile.maintenancePlanMentioned
        ? "Use tune-ups and plan messaging to create recurring opportunities."
        : "Build seasonal campaigns that bring homeowners back before breakdowns.",
    },
    {
      title: "Local trust",
      body: "Anchor the message in service areas, proof, and technician credibility.",
    },
  ];
}

function nonEmpty(values: string[], fallback: string[]) {
  return values.filter(Boolean).length ? values.filter(Boolean) : fallback;
}

function renderTextLines(
  lines: string[],
  x: number,
  y: number,
  fontSize: number,
  lineHeight: number,
  fill: string,
  weight: number,
  highlightColor?: string,
) {
  return lines
    .map((line, index) => {
      const words = line.split(" ");
      const lastWord = words.at(-1) ?? "";
      const rest = words.slice(0, -1).join(" ");

      if (highlightColor && index === lines.length - 1 && rest) {
        return `<text x="${x}" y="${y + index * lineHeight}" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${escapeXml(fill)}">${escapeXml(rest)} <tspan fill="${escapeXml(highlightColor)}">${escapeXml(lastWord)}</tspan></text>`;
      }

      return `<text x="${x}" y="${y + index * lineHeight}" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${escapeXml(fill)}">${escapeXml(line)}</text>`;
    })
    .join("\n  ");
}

function wrapText(value: string, maxChars: number, maxLines: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?]$/, "")}...`;
  }

  return lines.length ? lines : ["Your Comfort Starts Here"];
}

function normalizeColor(value: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function chooseActionColor(accentColor: string, primaryColor: string) {
  const accent = normalizeColor(accentColor, "");
  return accent || normalizeColor(primaryColor, "#0f8f45");
}

function darken(hex: string, percent: number) {
  const amount = Math.max(0, Math.min(100, percent)) / 100;
  const numeric = Number.parseInt(hex.slice(1), 16);
  const r = Math.round(((numeric >> 16) & 255) * (1 - amount));
  const g = Math.round(((numeric >> 8) & 255) * (1 - amount));
  const b = Math.round((numeric & 255) * (1 - amount));
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

function lighten(hex: string, percent: number) {
  const amount = Math.max(0, Math.min(100, percent)) / 100;
  const numeric = Number.parseInt(hex.slice(1), 16);
  const r = Math.round(((numeric >> 16) & 255) + (255 - ((numeric >> 16) & 255)) * amount);
  const g = Math.round(((numeric >> 8) & 255) + (255 - ((numeric >> 8) & 255)) * amount);
  const b = Math.round((numeric & 255) + (255 - (numeric & 255)) * amount);
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

function tint(hex: string, percent: number) {
  return lighten(hex, percent);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "hvac";
}
