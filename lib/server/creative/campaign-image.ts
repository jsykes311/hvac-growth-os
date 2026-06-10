import type { BusinessProfile, CampaignImage, CampaignOutput } from "@/lib/types";

type CreativeInput = {
  profile: BusinessProfile;
  campaign: CampaignOutput;
  goal: string;
  offer: string;
};

type CreativePalette = {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  cta: string;
  page: string;
  surface: string;
  soft: string;
  border: string;
  body: string;
  muted: string;
};

const WIDTH = 1200;
const HEIGHT = 1840;

export async function createCampaignImage({
  profile,
  campaign,
  goal,
  offer,
}: CreativeInput): Promise<CampaignImage> {
  const logoDataUrl = await fetchImageAsDataUrl(profile.logoUrl, 800000);
  const heroImageDataUrl = await fetchImageAsDataUrl(profile.heroImageUrl, 2200000);
  const primary = normalizeColor(profile.primaryColor, "#0f8f45");
  const secondary = normalizeColor(profile.secondaryColor, darken(primary, 28));
  const accent = chooseActionColor(profile.accentColor, primary);
  const palette = buildPalette(primary, secondary, accent);
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
  const heroLines = wrapText(heroHeadline, 18, 3);
  const introLines = wrapText(campaign.landingPageHero.subheadline, 58, 3);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="heroPhoto" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="${escapeXml(palette.dark)}"/>
      <stop offset="44%" stop-color="${escapeXml(darken(palette.secondary, 18))}"/>
      <stop offset="100%" stop-color="${escapeXml(tint(palette.primary, 70))}"/>
    </linearGradient>
    <linearGradient id="heroShade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="${escapeXml(palette.dark)}" stop-opacity="0.94"/>
      <stop offset="48%" stop-color="${escapeXml(palette.dark)}" stop-opacity="0.58"/>
      <stop offset="78%" stop-color="${escapeXml(palette.dark)}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${escapeXml(palette.dark)}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="lawn" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="${escapeXml(darken(primary, 18))}"/>
      <stop offset="100%" stop-color="${escapeXml(tint(palette.accent, 46))}"/>
    </linearGradient>
    <filter id="pageShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="${escapeXml(palette.dark)}" flood-opacity="0.18"/>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="${escapeXml(palette.dark)}" flood-opacity="0.28"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${escapeXml(palette.page)}"/>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" filter="url(#pageShadow)"/>

  ${renderHeroBackground(palette, heroImageDataUrl)}
  ${renderLogoMark(logoDataUrl, company, palette)}
  ${renderHeroText(heroLines, introLines, palette)}

  ${renderTopBenefitStrip(proofCards, palette)}
  ${renderIntroSection(goal, opportunity, campaign.landingPageHero, palette)}
  ${renderDifferentiatorCards(differentiators, palette)}
  ${renderBlackBand(company, campaign.landingPageHero.subheadline, palette)}
  ${renderCtaBand(campaign.landingPageHero.primaryCta, offer, palette)}
  ${renderFooter(logoDataUrl, company, phone, email, serviceArea, topService, palette)}
</svg>`.trim();

  return {
    dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    fileName: `${slugify(company)}-campaign-onepager.svg`,
    format: "svg",
    width: WIDTH,
    height: HEIGHT,
  };
}

async function fetchImageAsDataUrl(imageUrl: string, maxBytes: number) {
  if (!imageUrl) return "";

  try {
    const parsed = new URL(imageUrl);

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

    if (bytes.byteLength > maxBytes) {
      return "";
    }

    return `data:${contentType};base64,${bytes.toString("base64")}`;
  } catch {
    return "";
  }
}

function renderHeroBackground(palette: CreativePalette, heroImageDataUrl: string) {
  if (heroImageDataUrl) {
    return `
  <g>
    <rect x="0" y="0" width="${WIDTH}" height="510" fill="${escapeXml(palette.dark)}"/>
    <image href="${escapeXml(heroImageDataUrl)}" x="0" y="0" width="${WIDTH}" height="510" preserveAspectRatio="xMidYMid slice"/>
    <rect x="0" y="0" width="${WIDTH}" height="510" fill="url(#heroShade)"/>
    <rect x="0" y="0" width="${WIDTH}" height="510" fill="${escapeXml(darken(palette.primary, 34))}" opacity="0.12"/>
    <rect x="0" y="382" width="${WIDTH}" height="128" fill="${escapeXml(darken(palette.primary, 28))}" opacity="0.58"/>
  </g>`;
  }

  return `
  <g>
    <rect x="0" y="0" width="${WIDTH}" height="510" fill="url(#heroPhoto)"/>
    <rect x="0" y="0" width="${WIDTH}" height="510" fill="url(#heroShade)"/>
    <rect x="0" y="382" width="${WIDTH}" height="128" fill="url(#lawn)" opacity="0.34"/>
    <circle cx="1008" cy="105" r="96" fill="#fff2d5" opacity="0.28"/>
    <path d="M642 216 L802 96 L966 216" fill="none" stroke="#fff7eb" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" opacity="0.72"/>
    <path d="M680 218 V372 H928 V218" fill="none" stroke="#fff7eb" stroke-width="12" opacity="0.62"/>
    <rect x="707" y="252" width="64" height="72" fill="${escapeXml(palette.dark)}" opacity="0.72"/>
    <rect x="810" y="252" width="70" height="54" fill="${escapeXml(palette.dark)}" opacity="0.58"/>
    <path d="M580 374 C660 334 739 387 814 350 C909 302 1016 316 1118 372" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.18"/>
    <rect x="940" y="252" width="116" height="105" rx="7" fill="${escapeXml(palette.dark)}" opacity="0.72"/>
    <path d="M958 278 H1038 M958 304 H1038 M958 330 H1038" stroke="${escapeXml(tint(palette.primary, 52))}" stroke-width="5" opacity="0.82"/>
    <circle cx="998" cy="307" r="28" fill="none" stroke="${escapeXml(palette.primary)}" stroke-width="7" opacity="0.92"/>
    <path d="M1045 186 C1065 219 1075 261 1072 322 L1116 351 L1080 358 L1046 336 C1018 377 960 383 932 348 C905 313 918 256 951 232 C972 217 1000 211 1022 216 C1020 197 1028 186 1045 186 Z" fill="${escapeXml(darken(palette.secondary, 36))}" opacity="0.82" filter="url(#softShadow)"/>
    <rect x="997" y="330" width="70" height="92" rx="16" fill="${escapeXml(darken(palette.secondary, 48))}" opacity="0.88"/>
    <path d="M1060 278 L1114 302 L1105 324 L1051 300 Z" fill="${escapeXml(palette.accent)}" opacity="0.6"/>
    <path d="M612 448 C718 404 802 448 912 420 C1002 397 1074 408 1160 452" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.24"/>
    <rect x="0" y="0" width="${WIDTH}" height="510" fill="#000000" opacity="0.04"/>
  </g>`;
}

function renderLogoMark(logoDataUrl: string, company: string, palette: CreativePalette) {
  if (logoDataUrl) {
    return `
  <rect x="58" y="58" width="300" height="86" rx="4" fill="#ffffff" opacity="0.96"/>
  <image href="${escapeXml(logoDataUrl)}" x="82" y="78" width="252" height="46" preserveAspectRatio="xMinYMid meet"/>`;
  }

  const short = company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  return `
  <text x="58" y="122" font-family="Inter, Arial, sans-serif" font-size="70" font-weight="950" fill="#ffffff">${escapeXml(short)}</text>
  <text x="62" y="150" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900" fill="${escapeXml(palette.accent)}" letter-spacing="1.5">HVAC GROWTH CAMPAIGN</text>`;
}

function renderHeroText(headlineLines: string[], introLines: string[], palette: CreativePalette) {
  const accentLineIndex = Math.max(0, headlineLines.length - 1);
  const headline = headlineLines
    .map((line, index) => {
      const fill = index === accentLineIndex ? palette.accent : "#ffffff";
      return `<text x="58" y="${223 + index * 58}" font-family="Inter, Arial, sans-serif" font-size="59" font-weight="950" fill="${escapeXml(fill)}">${escapeXml(line)}</text>`;
    })
    .join("\n  ");

  return `
  ${headline}
  ${renderTextLines(introLines, 58, 415, 20, 29, "#ffffff", 650)}`;
}

function renderTopBenefitStrip(cards: Array<{ title: string; body: string }>, palette: CreativePalette) {
  const cardWidth = WIDTH / 4;

  return `
  <g>
    <rect x="0" y="510" width="${WIDTH}" height="148" fill="${escapeXml(palette.surface)}"/>
    ${cards
      .slice(0, 4)
      .map((card, index) => {
        const x = index * cardWidth;
        return `
    <line x1="${x}" y1="510" x2="${x}" y2="658" stroke="${escapeXml(palette.border)}"/>
    <text x="${x + 28}" y="559" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="950" fill="${escapeXml(palette.primary)}">${escapeXml(card.title)}</text>
    ${renderTextLines(wrapText(card.body, 30, 2), x + 28, 588, 14, 23, palette.muted, 500)}`;
      })
      .join("\n")}
  </g>`;
}

function renderIntroSection(
  goal: string,
  opportunity: string,
  hero: CampaignOutput["landingPageHero"],
  palette: CreativePalette,
) {
  const bodyLines = wrapText(opportunity, 56, 3);
  const quoteLines = wrapText(hero.headline, 26, 4);

  return `
  <g>
    <rect x="0" y="658" width="${WIDTH}" height="258" fill="#ffffff"/>
    <text x="58" y="728" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="950" fill="${escapeXml(palette.primary)}" letter-spacing="3">${escapeXml(goal.toUpperCase())}</text>
    ${renderTextLines(bodyLines, 58, 775, 22, 32, palette.body, 500)}
    ${renderTextLines(wrapText(hero.subheadline, 66, 2), 58, 858, 17, 27, palette.muted, 500)}
    <rect x="668" y="720" width="430" height="146" fill="${escapeXml(palette.soft)}"/>
    <rect x="668" y="720" width="5" height="146" fill="${escapeXml(palette.primary)}"/>
    ${renderTextLines(quoteLines, 698, 770, 28, 35, palette.dark, 950, palette.accent)}
  </g>`;
}

function renderDifferentiatorCards(items: string[], palette: CreativePalette) {
  const cards = items.slice(0, 4);

  return `
  <g>
    <rect x="0" y="916" width="${WIDTH}" height="226" fill="#ffffff"/>
    ${cards
      .map((item, index) => {
        const x = 58 + index * 268;
        const lines = wrapText(item, 24, 4);
        return `
    <rect x="${x}" y="960" width="238" height="144" fill="#ffffff" stroke="${escapeXml(palette.border)}"/>
    <text x="${x + 22}" y="1002" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="950" fill="${escapeXml(palette.dark)}">${escapeXml(lines[0] ?? "Growth lever")}</text>
    ${renderTextLines(lines.slice(1), x + 22, 1034, 15, 23, palette.muted, 500)}
    <rect x="${x + 22}" y="1070" width="54" height="4" fill="${escapeXml(palette.primary)}"/>`;
      })
      .join("\n")}
  </g>`;
}

function renderBlackBand(company: string, body: string, palette: CreativePalette) {
  return `
  <g>
    <rect x="58" y="1174" width="1084" height="222" fill="${escapeXml(palette.dark)}"/>
    <text x="94" y="1237" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="950" fill="#ffffff">Busy season rewards teams</text>
    <text x="94" y="1277" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="950" fill="#ffffff">with a clear follow-up system.</text>
    ${renderTextLines(wrapText(`${company} can use this offer to move more homeowners from interest to booked appointments. ${body}`, 104, 3), 94, 1324, 17, 28, tint(palette.primary, 88), 500)}
    <rect x="94" y="1360" width="144" height="5" fill="${escapeXml(palette.accent)}"/>
  </g>`;
}

function renderCtaBand(cta: string, offer: string, palette: CreativePalette) {
  return `
  <g>
    <rect x="0" y="1454" width="${WIDTH}" height="136" fill="${escapeXml(palette.cta)}"/>
    <text x="58" y="1524" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="950" fill="#ffffff">${escapeXml(offer || "Ready-to-book comfort campaign")}</text>
    <text x="58" y="1556" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="600" fill="#ffffff" opacity="0.9">Launch a local campaign using the website analysis, offer, and brand profile.</text>
    <rect x="872" y="1498" width="250" height="54" rx="27" fill="none" stroke="#ffffff" opacity="0.65"/>
    <text x="997" y="1532" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="950" text-anchor="middle" fill="#ffffff">${escapeXml(cta)}</text>
  </g>`;
}

function renderFooter(
  logoDataUrl: string,
  company: string,
  phone: string,
  email: string,
  serviceArea: string,
  topService: string,
  palette: CreativePalette,
) {
  return `
  <g>
    <rect x="0" y="1590" width="${WIDTH}" height="250" fill="#ffffff"/>
    ${logoDataUrl ? `<image href="${escapeXml(logoDataUrl)}" x="82" y="1670" width="176" height="64" preserveAspectRatio="xMinYMid meet"/>` : `<text x="82" y="1713" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="950" fill="${escapeXml(palette.primary)}">${escapeXml(company.slice(0, 16))}</text>`}
    <rect x="306" y="1638" width="4" height="122" fill="${escapeXml(palette.primary)}"/>
    <text x="338" y="1662" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="950" fill="${escapeXml(palette.primary)}">${escapeXml(company)}</text>
    <text x="338" y="1695" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="800" fill="${escapeXml(palette.dark)}">${escapeXml(topService)} in ${escapeXml(serviceArea)}</text>
    <text x="338" y="1737" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" fill="${escapeXml(palette.dark)}">${escapeXml(phone || email || "Contact for booking")}</text>
    <text x="338" y="1767" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="500" fill="${escapeXml(palette.muted)}">${escapeXml(email)}</text>
    <text x="82" y="1810" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="500" fill="${escapeXml(palette.muted)}">Campaign creative generated from public website analysis. Offer terms and availability should be verified before launch.</text>
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

function buildPalette(primary: string, secondary: string, accent: string): CreativePalette {
  const dark = isLight(secondary) ? darken(primary, 58) : secondary;
  const cta = isLight(accent) ? primary : accent;
  const body = isLight(dark) ? darken(primary, 68) : dark;

  return {
    primary,
    secondary,
    accent,
    dark,
    cta,
    page: tint(primary, 93),
    surface: tint(primary, 96),
    soft: tint(primary, 94),
    border: tint(primary, 82),
    body,
    muted: mix(body, "#ffffff", 34),
  };
}

function isLight(hex: string) {
  return relativeLuminance(hex) > 0.62;
}

function relativeLuminance(hex: string) {
  const numeric = Number.parseInt(hex.slice(1), 16);
  const parts = [numeric >> 16, (numeric >> 8) & 255, numeric & 255].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
}

function mix(hexA: string, hexB: string, percentB: number) {
  const amount = Math.max(0, Math.min(100, percentB)) / 100;
  const a = Number.parseInt(hexA.slice(1), 16);
  const b = Number.parseInt(hexB.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) * (1 - amount) + ((b >> 16) & 255) * amount);
  const g = Math.round(((a >> 8) & 255) * (1 - amount) + ((b >> 8) & 255) * amount);
  const blue = Math.round((a & 255) * (1 - amount) + (b & 255) * amount);
  return `#${[r, g, blue].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
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
