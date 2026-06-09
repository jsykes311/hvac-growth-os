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
  const headlineLines = wrapText(campaign.landingPageHero.headline, 25, 3);
  const subheadlineLines = wrapText(campaign.landingPageHero.subheadline, 44, 2);
  const offerLines = wrapText(offer, 28, 2);
  const company = profile.companyName || "Local HVAC Pros";
  const phone = profile.phone || "";
  const serviceArea = profile.serviceAreas[0] || "your area";
  const service = profile.services[0] || "HVAC Service";
  const proofPoints = [
    profile.emergencyServiceMentioned ? "Emergency service" : "Fast scheduling",
    profile.financingMentioned ? "Financing options" : "Clear recommendations",
    profile.maintenancePlanMentioned ? "Maintenance plans" : "Local technicians",
  ];
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="brand" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${escapeXml(lighten(primary, 8))}"/>
      <stop offset="100%" stop-color="${escapeXml(darken(primary, 18))}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#101828" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#eef3f7"/>
  <rect x="0" y="0" width="1200" height="628" fill="${escapeXml(secondary)}" opacity="0.24"/>
  <rect x="44" y="44" width="1112" height="540" rx="34" fill="#ffffff" filter="url(#shadow)"/>
  <rect x="44" y="44" width="1112" height="96" rx="34" fill="url(#brand)"/>
  <rect x="44" y="106" width="1112" height="34" fill="url(#brand)"/>
  <text x="86" y="105" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" fill="#ffffff">${escapeXml(serviceArea)} HVAC SPECIALISTS</text>
  ${renderLogo(logoDataUrl, company)}

  <rect x="86" y="178" width="512" height="64" rx="32" fill="${escapeXml(tint(accent, 90))}"/>
  <circle cx="122" cy="210" r="18" fill="${escapeXml(accent)}"/>
  <text x="122" y="218" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="900" text-anchor="middle" fill="#ffffff">$</text>
  ${renderTextLines(offerLines, 154, 204, 24, 28, darken(accent, 18), 900)}

  ${renderTextLines(headlineLines, 86, 315, 58, 62, primary, 950)}
  ${renderTextLines(subheadlineLines, 88, 474, 25, 34, "#435164", 650)}

  <rect x="86" y="514" width="${ctaWidth(campaign.landingPageHero.primaryCta)}" height="54" rx="12" fill="${escapeXml(accent)}"/>
  <text x="112" y="549" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="950" fill="#ffffff">${escapeXml(campaign.landingPageHero.primaryCta)}</text>
  <text x="462" y="548" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="850" fill="${escapeXml(primary)}">${escapeXml(phone || company)}</text>

  <rect x="704" y="174" width="382" height="330" rx="26" fill="${escapeXml(primary)}"/>
  <rect x="728" y="198" width="334" height="282" rx="22" fill="#ffffff" opacity="0.96"/>
  <path d="M789 331 L895 245 L1001 331" fill="none" stroke="${escapeXml(primary)}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M817 329 V421 H973 V329" fill="none" stroke="${escapeXml(primary)}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="870" y="361" width="54" height="60" rx="8" fill="${escapeXml(tint(primary, 82))}"/>
  <circle cx="989" cy="226" r="30" fill="${escapeXml(accent)}"/>
  <path d="M989 202 V250 M965 226 H1013" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>
  <path d="M780 448 C833 407 886 488 936 446 C967 420 1004 424 1034 448" fill="none" stroke="${escapeXml(accent)}" stroke-width="11" stroke-linecap="round"/>
  <rect x="734" y="520" width="318" height="42" rx="21" fill="${escapeXml(tint(primary, 90))}"/>
  <text x="893" y="548" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="900" text-anchor="middle" fill="${escapeXml(primary)}">${escapeXml(service)}</text>
  ${renderProofPoints(proofPoints, primary, accent)}
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
  <rect x="900" y="64" width="206" height="58" rx="14" fill="#ffffff" opacity="0.98"/>
  <image href="${escapeXml(logoDataUrl)}" x="922" y="76" width="162" height="34" preserveAspectRatio="xMidYMid meet"/>`;
  }

  return `
  <rect x="870" y="64" width="236" height="58" rx="14" fill="#ffffff" opacity="0.98"/>
  <text x="988" y="101" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="950" text-anchor="middle" fill="#14213d">${escapeXml(company.slice(0, 24))}</text>`;
}

function renderProofPoints(points: string[], primary: string, accent: string) {
  return points
    .slice(0, 3)
    .map((point, index) => {
      const y = 180 + index * 54;
      return `
  <rect x="642" y="${y}" width="182" height="38" rx="19" fill="${escapeXml(index === 0 ? accent : tint(primary, 88))}"/>
  <text x="733" y="${y + 25}" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="900" text-anchor="middle" fill="${index === 0 ? "#ffffff" : escapeXml(primary)}">${escapeXml(point)}</text>`;
    })
    .join("");
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
