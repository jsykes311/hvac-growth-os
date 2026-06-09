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
  const action = chooseActionColor(profile.accentColor, primary);
  const softAction = tint(action, 90);
  const headlineLines = wrapText(campaign.landingPageHero.headline, 24, 3);
  const subheadlineLines = wrapText(campaign.landingPageHero.subheadline, 39, 2);
  const offerLines = wrapText(offer, 25, 1);
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
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="20" flood-color="#52677b" flood-opacity="0.28"/>
    </filter>
  </defs>
  <rect x="20" y="10" width="1160" height="608" rx="6" fill="#c8d8e6"/>
  <rect x="64" y="54" width="1072" height="520" rx="34" fill="#ffffff" filter="url(#shadow)"/>
  <path d="M98 54 H1102 A34 34 0 0 1 1136 88 V146 H64 V88 A34 34 0 0 1 98 54 Z" fill="${escapeXml(action)}"/>
  <rect x="64" y="112" width="1072" height="34" fill="${escapeXml(darken(action, 6))}" opacity="0.42"/>
  <text x="104" y="110" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="950" fill="#ffffff">${escapeXml(serviceArea)} HVAC SPECIALISTS</text>
  ${renderLogo(logoDataUrl, company)}

  <rect x="104" y="184" width="500" height="62" rx="31" fill="${escapeXml(softAction)}"/>
  <circle cx="139" cy="215" r="18" fill="${escapeXml(action)}"/>
  <text x="139" y="223" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="950" text-anchor="middle" fill="#ffffff">$</text>
  ${renderTextLines(offerLines, 170, 218, 25, 28, darken(action, 14), 950)}

  ${renderTextLines(headlineLines, 104, 316, 56, 58, action, 950)}
  ${renderTextLines(subheadlineLines, 106, 450, 27, 33, "#435164", 800)}

  <rect x="104" y="508" width="${ctaWidth(campaign.landingPageHero.primaryCta)}" height="52" rx="10" fill="${escapeXml(action)}"/>
  <text x="130" y="542" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="950" fill="#ffffff">${escapeXml(campaign.landingPageHero.primaryCta)}</text>
  <text x="478" y="540" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="950" fill="${escapeXml(action)}">${escapeXml(phone)}</text>

  ${renderProofPoints(proofPoints, action)}
  <rect x="702" y="178" width="370" height="320" rx="28" fill="${escapeXml(action)}"/>
  <rect x="724" y="200" width="326" height="276" rx="22" fill="#fff7f6"/>
  <path d="M783 326 L887 242 L991 326" fill="none" stroke="${escapeXml(action)}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M810 324 V420 H964 V324" fill="none" stroke="${escapeXml(action)}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="862" y="359" width="52" height="56" rx="8" fill="${escapeXml(tint(action, 84))}"/>
  <circle cx="985" cy="228" r="31" fill="${escapeXml(action)}"/>
  <path d="M985 202 V254 M959 228 H1011" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>
  <path d="M780 448 C830 406 881 488 932 446 C964 419 1004 424 1032 448" fill="none" stroke="${escapeXml(action)}" stroke-width="10" stroke-linecap="round"/>
  <rect x="730" y="514" width="310" height="42" rx="21" fill="${escapeXml(softAction)}"/>
  <text x="885" y="542" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="950" text-anchor="middle" fill="${escapeXml(action)}">${escapeXml(service)}</text>
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

function renderProofPoints(points: string[], action: string) {
  return points
    .slice(0, 3)
    .map((point, index) => {
      const y = 182 + index * 46;
      const width = index === 0 ? 178 : 178;
      const x = index === 0 ? 640 : 640;
      return `
  <rect x="${x}" y="${y}" width="${width}" height="38" rx="19" fill="${escapeXml(index === 0 ? action : tint(action, 90))}"/>
  <text x="${x + width / 2}" y="${y + 25}" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="950" text-anchor="middle" fill="${index === 0 ? "#ffffff" : escapeXml(action)}">${escapeXml(point)}</text>`;
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

function chooseActionColor(accentColor: string, primaryColor: string) {
  const accent = normalizeColor(accentColor, "");

  if (accent) {
    return accent;
  }

  return normalizeColor(primaryColor, "#c71912");
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
