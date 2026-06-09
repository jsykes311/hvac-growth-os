import type { ScrapedPage } from "@/lib/types";
import { sameOriginUrl } from "@/lib/server/urls";

type FirecrawlScrapeData = {
  markdown?: string;
  html?: string;
  links?: string[];
  metadata?: {
    title?: string;
    sourceURL?: string;
    url?: string;
    error?: string;
  };
  branding?: {
    logo?: string;
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
      textPrimary?: string;
      link?: string;
    };
    fonts?: Array<{ family?: string }>;
    personality?: unknown;
    images?: {
      logo?: string;
      favicon?: string;
      ogImage?: string;
    };
  };
};

type FirecrawlScrapeResponse = {
  success?: boolean;
  data?: FirecrawlScrapeData;
  error?: string;
};

type PageTarget = {
  label: ScrapedPage["label"];
  patterns: RegExp[];
  fallbackPaths: string[];
};

const PAGE_TARGETS: PageTarget[] = [
  {
    label: "About",
    patterns: [/about/i, /company/i, /our-story/i, /who-we-are/i],
    fallbackPaths: ["/about", "/about-us", "/company"],
  },
  {
    label: "Services",
    patterns: [/services?/i, /heating/i, /air-conditioning/i, /hvac/i],
    fallbackPaths: ["/services", "/hvac-services", "/heating-and-air-conditioning"],
  },
  {
    label: "Contact",
    patterns: [/contact/i, /schedule/i, /book/i],
    fallbackPaths: ["/contact", "/contact-us", "/schedule-service"],
  },
  {
    label: "Financing",
    patterns: [/financ/i, /payment/i, /special/i, /coupon/i],
    fallbackPaths: ["/financing", "/specials", "/coupons"],
  },
];

export type ScrapeSiteResult = {
  pages: ScrapedPage[];
  branding: FirecrawlScrapeData["branding"];
};

export async function scrapeSite(websiteUrl: string): Promise<ScrapeSiteResult> {
  const homepage = await scrapeUrl(websiteUrl, ["markdown", "html", "links", "branding"]);
  const pages: ScrapedPage[] = [toScrapedPage("Homepage", websiteUrl, homepage)];
  const discoveredUrls = discoverTargetUrls(websiteUrl, homepage.links ?? []);

  for (const target of PAGE_TARGETS) {
    const targetUrl = discoveredUrls.get(target.label);
    if (!targetUrl) continue;

    try {
      const page = await scrapeUrl(targetUrl, ["markdown", "html"]);
      pages.push(toScrapedPage(target.label, targetUrl, page));
    } catch (error) {
      if (target.label !== "Financing") {
        throw error;
      }
    }
  }

  return {
    pages,
    branding: homepage.branding,
  };
}

async function scrapeUrl(url: string, formats: string[]) {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FIRECRAWL_API_KEY.");
  }

  const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats,
      onlyMainContent: false,
      removeBase64Images: true,
      blockAds: true,
      timeout: 60000,
    }),
  });

  const payload = (await response.json().catch(() => null)) as FirecrawlScrapeResponse | null;

  if (!response.ok || !payload?.success || !payload.data) {
    const message = payload?.error || payload?.data?.metadata?.error || `Firecrawl failed for ${url}.`;
    throw new Error(message);
  }

  return payload.data;
}

function toScrapedPage(label: ScrapedPage["label"], url: string, data: FirecrawlScrapeData): ScrapedPage {
  return {
    label,
    url: data.metadata?.sourceURL || data.metadata?.url || url,
    title: data.metadata?.title || label,
    markdown: trimContent(data.markdown ?? "", 16000),
    html: trimContent(data.html ?? "", 14000),
  };
}

function discoverTargetUrls(baseUrl: string, links: string[]) {
  const normalizedLinks = links
    .map((link) => sameOriginUrl(baseUrl, link))
    .filter((link): link is string => Boolean(link));
  const result = new Map<ScrapedPage["label"], string>();

  for (const target of PAGE_TARGETS) {
    const linkedUrl = normalizedLinks.find((link) =>
      target.patterns.some((pattern) => pattern.test(link)),
    );

    if (linkedUrl) {
      result.set(target.label, linkedUrl);
      continue;
    }

    const fallbackUrl = target.fallbackPaths
      .map((path) => sameOriginUrl(baseUrl, path))
      .find((link): link is string => Boolean(link));

    if (fallbackUrl && target.label !== "Financing") {
      result.set(target.label, fallbackUrl);
    }
  }

  return result;
}

function trimContent(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}\n[Truncated]` : value;
}
