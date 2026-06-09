export function normalizeWebsiteUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Enter a valid website URL.");
  }

  const candidate = value.trim().startsWith("http")
    ? value.trim()
    : `https://${value.trim()}`;
  const parsed = new URL(candidate);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Website URL must start with http or https.");
  }

  parsed.hash = "";
  return parsed.toString();
}

export function sameOriginUrl(baseUrl: string, href: string): string | null {
  try {
    const base = new URL(baseUrl);
    const next = new URL(href, base);
    next.hash = "";

    if (next.origin !== base.origin) {
      return null;
    }

    return next.toString();
  } catch {
    return null;
  }
}
