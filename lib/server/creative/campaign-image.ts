import type { BusinessProfile, CampaignImage, CampaignOutput } from "@/lib/types";

type CreativeInput = {
  profile: BusinessProfile;
  campaign: CampaignOutput;
  goal: string;
  offer: string;
};

const WIDTH = 1200;
const HEIGHT = 628;

export async function createCampaignImage({
  profile,
  campaign,
  goal,
  offer,
}: CreativeInput): Promise<CampaignImage> {
  const logoDataUrl = await fetchLogoAsDataUrl(profile.logoUrl);
  const primary = normalizeColor(profile.primaryColor, "#14213d");
  const secondary = normalizeColor(profile.secondaryColor, "#f4f8fb");
  const accent = normalizeColor(profile.accentColor, "#e94f37");
  const headlineLines = wrapText(campaign.landingPageHero.headline, 32, 3);
  const subheadlineLines = wrapText(campaign.landingPageHero.subheadline, 54, 2);
  const company = profile.companyName || "Local HVAC Pros";
  const phone = profile.phone || "";
  const serviceArea = profile.serviceAreas[0] || "your area";
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${escapeXml(primary)}"/>
      <stop offset="100%" stop-color="${escapeXml(darken(primary, 28))}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <path d="M0 500 C190 420 330 600 530 515 C760 420 935 460 1200 360 L1200 628 L0 628 Z" fill="${escapeXml(secondary)}" opacity="0.18"/>
  <circle cx="1060" cy="92" r="240" fill="${escapeXml(accent)}" opacity="0.18"/>
  <rect x="68" y="66" width="1064" height="496" rx="30" fill="#ffffff" opacity="0.96" filter="url(#shadow)"/>
  <rect x="68" y="66" width="18" height="496" rx="9" fill="${escapeXml(accent)}"/>
  ${renderLogo(logoDataUrl, company)}
  <text x="118" y="124" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="800" fill="${escapeXml(accent)}" letter-spacing="2">${escapeXml(goal.toUpperCase())}</text>
  ${renderTextLines(headlineLines, 118, 205, 58, 64, primary, 900)}
  ${renderTextLines(subheadlineLines, 118, 400, 30, 40, "#24303f", 600)}
  <rect x="118" y="470" width="${ctaWidth(campaign.landingPageHero.primaryCta)}" height="62" rx="10" fill="${escapeXml(accent)}"/>
  <text x="148" y="510" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" fill="#ffffff">${escapeXml(campaign.landingPageHero.primaryCta)}</text>
  <text x="118" y="560" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800" fill="${escapeXml(primary)}">${escapeXml(offer)}</text>
  <text x="760" y="514" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="900" text-anchor="end" fill="${escapeXml(primary)}">${escapeXml(company)}</text>
  <text x="760" y="548" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" text-anchor="end" fill="#526071">${escapeXml([serviceArea, phone].filter(Boolean).join(" | "))}</text>
</svg>`.trim();

  return {
    dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    fileName: `${slugify(company)}-campaign-creative.svg`,
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

function renderLogo(logoDataUrl: string, company: string) {
  if (logoDataUrl) {
    return `
  <rect x="878" y="102" width="196" height="96" rx="18" fill="#ffffff"/>
  <image href="${escapeXml(logoDataUrl)}" x="900" y="122" width="152" height="56" preserveAspectRatio="xMidYMid meet"/>`;
  }

  return `
  <rect x="846" y="104" width="228" height="88" rx="18" fill="#f4f8fb"/>
  <text x="960" y="156" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="900" text-anchor="middle" fill="#14213d">${escapeXml(company.slice(0, 24))}</text>`;
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

function ctaWidth(value: string) {
  return Math.min(390, Math.max(210, value.length * 14 + 60));
}

function normalizeColor(value: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function darken(hex: string, percent: number) {
  const amount = Math.max(0, Math.min(100, percent)) / 100;
  const numeric = Number.parseInt(hex.slice(1), 16);
  const r = Math.round(((numeric >> 16) & 255) * (1 - amount));
  const g = Math.round(((numeric >> 8) & 255) * (1 - amount));
  const b = Math.round((numeric & 255) * (1 - amount));
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
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
