import type { BusinessProfile, CampaignImage, CampaignOutput } from "@/lib/types";

type CreativeInput = {
  profile: BusinessProfile;
  campaign: CampaignOutput;
  goal: string;
  offer: string;
  generatedHeroImageDataUrl?: string;
};

type CreativePalette = {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  soft: string;
  muted: string;
};

const WIDTH = 1536;
const HEIGHT = 864;

export async function createCampaignImage({
  profile,
  campaign,
  offer,
  generatedHeroImageDataUrl = "",
}: CreativeInput): Promise<CampaignImage> {
  const logoDataUrl = await fetchImageAsDataUrl(profile.logoUrl, 800000);
  const primary = normalizeColor(profile.primaryColor, "#0f8f45");
  const secondary = normalizeColor(profile.secondaryColor, darken(primary, 36));
  const accent = chooseActionColor(profile.accentColor, primary);
  const palette = buildPalette(primary, secondary, accent);
  const company = profile.companyName || "Local HVAC Pros";
  const headline = buildHeroHeadline(profile, campaign, offer);
  const subheadline = buildHeroSubheadline(profile, campaign, offer);
  const proofCards = buildProofCards(profile);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="photoFallback" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${escapeXml(tint(palette.primary, 86))}"/>
      <stop offset="52%" stop-color="${escapeXml(tint(palette.secondary, 64))}"/>
      <stop offset="100%" stop-color="${escapeXml(darken(palette.secondary, 18))}"/>
    </linearGradient>
    <linearGradient id="textShade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="${escapeXml(palette.dark)}" stop-opacity="0.98"/>
      <stop offset="42%" stop-color="${escapeXml(palette.dark)}" stop-opacity="0.92"/>
      <stop offset="70%" stop-color="${escapeXml(palette.dark)}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${escapeXml(palette.dark)}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="topGlow" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.58"/>
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bottomDepth" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="${escapeXml(palette.dark)}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${escapeXml(palette.dark)}" stop-opacity="0.7"/>
    </linearGradient>
    <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
    <clipPath id="logoClip">
      <rect x="64" y="56" width="212" height="70" rx="7"/>
    </clipPath>
  </defs>

  ${renderHeroBackground(generatedHeroImageDataUrl, palette)}
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#textShade)"/>
  <rect x="0" y="0" width="640" height="${HEIGHT}" fill="${escapeXml(palette.dark)}" opacity="0.82"/>
  <rect x="0" y="566" width="690" height="298" fill="${escapeXml(palette.dark)}" opacity="0.74"/>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#topGlow)"/>
  <rect x="0" y="610" width="${WIDTH}" height="254" fill="url(#bottomDepth)"/>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="${escapeXml(palette.primary)}" opacity="0.07"/>

  ${renderLogo(logoDataUrl, company, palette)}
  ${renderHeroCopy(headline, subheadline, palette)}
  ${renderProofStack(proofCards, palette)}
  <rect x="0" y="0" width="${WIDTH}" height="10" fill="${escapeXml(palette.primary)}" opacity="0.84"/>
</svg>`.trim();

  return {
    dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    fileName: `${slugify(company)}-campaign-hero-ad.svg`,
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

function renderHeroBackground(heroImageDataUrl: string, palette: CreativePalette) {
  if (heroImageDataUrl) {
    return `
  <image href="${escapeXml(heroImageDataUrl)}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice"/>`;
  }

  return `
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#photoFallback)"/>
  <circle cx="1210" cy="156" r="130" fill="#fff1d0" opacity="0.34"/>
  <path d="M1086 384 L1256 250 L1428 384" fill="none" stroke="#fff7e5" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/>
  <path d="M1124 386 V584 H1392 V386" fill="none" stroke="#fff7e5" stroke-width="13" opacity="0.32"/>
  <rect x="1260" y="424" width="124" height="92" rx="8" fill="${escapeXml(palette.dark)}" opacity="0.42"/>
  <rect x="812" y="538" width="248" height="118" rx="12" fill="${escapeXml(palette.dark)}" opacity="0.42"/>
  <path d="M835 584 H1036 M835 622 H1036" stroke="${escapeXml(tint(palette.primary, 58))}" stroke-width="8" opacity="0.7"/>
  <circle cx="1510" cy="20" r="240" fill="#ffffff" opacity="0.16"/>`;
}

function renderLogo(logoDataUrl: string, company: string, palette: CreativePalette) {
  if (logoDataUrl) {
    return `
  <rect x="64" y="56" width="212" height="70" rx="7" fill="#ffffff" opacity="0.96" filter="url(#logoShadow)"/>
  <image href="${escapeXml(logoDataUrl)}" x="76" y="62" width="188" height="58" preserveAspectRatio="xMidYMid slice" clip-path="url(#logoClip)"/>`;
  }

  const companyLines = wrapText(company, 17, 2);

  return `
  <text x="64" y="104" font-family="Impact, Inter, Arial Black, sans-serif" font-size="44" font-weight="950" fill="${escapeXml(palette.primary)}">${escapeXml(companyLines[0] || company)}</text>
  ${companyLines[1] ? `<text x="64" y="148" font-family="Impact, Inter, Arial Black, sans-serif" font-size="44" font-weight="950" fill="${escapeXml(palette.primary)}">${escapeXml(companyLines[1])}</text>` : ""}`;
}

function renderHeroCopy(headline: string, subheadline: string, palette: CreativePalette) {
  const lines = wrapText(headline, 22, 3, false);
  const subLines = wrapText(subheadline, 42, 2, false);
  const firstBlock = lines
    .map(
      (line, index) =>
        `<text x="64" y="${230 + index * 62}" font-family="Impact, Inter, Arial Black, sans-serif" font-size="58" font-weight="950" fill="#ffffff" letter-spacing="0.5">${escapeXml(line.toUpperCase())}</text>`,
    )
    .join("\n  ");

  return `
  ${firstBlock}
  <rect x="66" y="432" width="116" height="5" fill="${escapeXml(palette.primary)}"/>
  ${renderTextLines(subLines, 66, 486, 26, 37, "#ffffff", 700)}`;
}

function renderProofStack(cards: Array<{ title: string; body: string; icon: "chart" | "shield" | "team" | "cash" }>, palette: CreativePalette) {
  return cards
    .slice(0, 3)
    .map((card, index) => {
      const y = 614 + index * 82;
      return `
  <g>
    <circle cx="102" cy="${y}" r="27" fill="${escapeXml(palette.dark)}" opacity="0.36"/>
    <circle cx="102" cy="${y}" r="25" fill="none" stroke="${escapeXml(palette.primary)}" stroke-width="3"/>
    ${renderIcon(card.icon, 102, y, palette.primary)}
    <text x="158" y="${y - 8}" font-family="Impact, Inter, Arial Black, sans-serif" font-size="23" font-weight="950" fill="${escapeXml(palette.primary)}">${escapeXml(card.title.toUpperCase())}</text>
    ${renderTextLines(wrapText(card.body, 44, 1, false), 158, y + 21, 17, 24, "#ffffff", 650)}
  </g>`;
    })
    .join("\n");
}

function renderIcon(icon: "chart" | "shield" | "team" | "cash", cx: number, cy: number, color: string) {
  if (icon === "shield") {
    return `<path d="M${cx} ${cy - 22} L${cx + 20} ${cy - 13} V${cy + 4} C${cx + 20} ${cy + 19} ${cx + 8} ${cy + 26} ${cx} ${cy + 30} C${cx - 8} ${cy + 26} ${cx - 20} ${cy + 19} ${cx - 20} ${cy + 4} V${cy - 13} Z" fill="none" stroke="${escapeXml(color)}" stroke-width="3"/><path d="M${cx - 10} ${cy + 2} L${cx - 2} ${cy + 10} L${cx + 14} ${cy - 8}" fill="none" stroke="${escapeXml(color)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  if (icon === "team") {
    return `<circle cx="${cx}" cy="${cy - 11}" r="9" fill="none" stroke="${escapeXml(color)}" stroke-width="3"/><circle cx="${cx - 18}" cy="${cy - 6}" r="7" fill="none" stroke="${escapeXml(color)}" stroke-width="3"/><circle cx="${cx + 18}" cy="${cy - 6}" r="7" fill="none" stroke="${escapeXml(color)}" stroke-width="3"/><path d="M${cx - 18} ${cy + 23} C${cx - 16} ${cy + 8} ${cx + 16} ${cy + 8} ${cx + 18} ${cy + 23}" fill="none" stroke="${escapeXml(color)}" stroke-width="3"/><path d="M${cx - 34} ${cy + 20} C${cx - 31} ${cy + 8} ${cx - 12} ${cy + 8} ${cx - 10} ${cy + 17}" fill="none" stroke="${escapeXml(color)}" stroke-width="3"/><path d="M${cx + 10} ${cy + 17} C${cx + 12} ${cy + 8} ${cx + 31} ${cy + 8} ${cx + 34} ${cy + 20}" fill="none" stroke="${escapeXml(color)}" stroke-width="3"/>`;
  }

  if (icon === "cash") {
    return `<path d="M${cx - 25} ${cy + 16} L${cx - 10} ${cy + 1} L${cx + 3} ${cy + 9} L${cx + 25} ${cy - 18}" fill="none" stroke="${escapeXml(color)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M${cx + 12} ${cy - 18} H${cx + 25} V${cy - 5}" fill="none" stroke="${escapeXml(color)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="${cx + 10}" y="${cy + 25}" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="950" fill="${escapeXml(color)}">$</text>`;
  }

  return `<path d="M${cx - 24} ${cy + 18} V${cy - 2} H${cx - 10} V${cy + 18} M${cx - 2} ${cy + 18} V${cy - 19} H${cx + 12} V${cy + 18} M${cx + 20} ${cy + 18} V${cy - 9} H${cx + 34} V${cy + 18}" fill="none" stroke="${escapeXml(color)}" stroke-width="3"/><path d="M${cx - 26} ${cy + 18} H${cx + 38}" stroke="${escapeXml(color)}" stroke-width="3"/><path d="M${cx - 22} ${cy - 19} L${cx - 6} ${cy - 30} L${cx + 7} ${cy - 22} L${cx + 31} ${cy - 47}" fill="none" stroke="${escapeXml(color)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M${cx + 17} ${cy - 47} H${cx + 31} V${cy - 33}" fill="none" stroke="${escapeXml(color)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function buildProofCards(profile: BusinessProfile) {
  return [
    {
      title: profile.financingMentioned ? "Payment options" : "Clear pricing",
      body: profile.financingMentioned
        ? "Help homeowners say yes to bigger jobs."
        : "Give homeowners a clear reason to call.",
      icon: "chart" as const,
    },
    {
      title: profile.emergencyServiceMentioned ? "Emergency calls" : "Fast booking",
      body: profile.emergencyServiceMentioned
        ? "Turn urgent no-cool calls into booked work."
        : "Make the next step obvious and simple.",
      icon: "shield" as const,
    },
    {
      title: "Local trust",
      body: profile.maintenancePlanMentioned
        ? "Use tune-ups and reviews to earn repeat work."
        : "Lead with reviews, service areas, and proof.",
      icon: "team" as const,
    },
  ];
}

function buildHeroHeadline(profile: BusinessProfile, campaign: CampaignOutput, offer: string) {
  const headline = cleanDisplayText(campaign.landingPageHero.headline);
  const service = profile.services[0] || "HVAC Service";

  if (headline && headline.length <= 58 && !headline.includes("...")) {
    return headline;
  }

  if (offer) {
    return `${cleanDisplayText(offer)} from Local HVAC Pros`;
  }

  return `Trusted ${service} Help`;
}

function buildHeroSubheadline(profile: BusinessProfile, campaign: CampaignOutput, offer: string) {
  const area = profile.serviceAreas[0] || "the local market";
  const service = profile.services[0] || "HVAC service";
  const company = profile.companyName || "this contractor";
  const subheadline = cleanDisplayText(campaign.landingPageHero.subheadline);

  if (subheadline && subheadline.length <= 88 && !subheadline.includes("...")) {
    return subheadline;
  }

  if (offer) {
    return `${company} helps homeowners in ${area} book reliable ${service} with a clear offer.`;
  }

  return `${company} gives local homeowners a clear path from comfort problem to booked appointment.`;
}

function cleanDisplayText(value: string) {
  return value.replace(/\s+/g, " ").replace(/[.]{3,}/g, "").trim();
}

function renderTextLines(
  lines: string[],
  x: number,
  y: number,
  fontSize: number,
  lineHeight: number,
  fill: string,
  weight: number,
) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${escapeXml(fill)}">${escapeXml(line)}</text>`,
    )
    .join("\n  ");
}

function wrapText(value: string, maxChars: number, maxLines: number, useEllipsis = true) {
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

  if (useEllipsis && lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
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
  const dark = isLight(secondary) ? darken(primary, 64) : darken(secondary, 12);

  return {
    primary,
    secondary,
    accent,
    dark,
    soft: tint(primary, 88),
    muted: tint(dark, 68),
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
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "hvac"
  );
}
