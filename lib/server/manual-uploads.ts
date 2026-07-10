import { getComfortGuardiansHistory, recordComfortGuardiansHistoryEvent } from "@/lib/server/history-store";

export type MarketingUploadSource = "google_ads" | "google_business_profile";

export type MarketingUploadSummary = {
  averageCpc?: number;
  calls?: number;
  clicks?: number;
  conversions?: number;
  cost?: number;
  ctr?: number;
  directionRequests?: number;
  fileName: string;
  impressions?: number;
  interactions?: number;
  messages?: number;
  metricDate: string;
  rows: number;
  source: MarketingUploadSource;
  topRows: Array<Record<string, string | number>>;
  websiteClicks?: number;
};

export async function saveMarketingPerformanceUpload(input: {
  csv: string;
  fileName: string;
  metricDate?: string;
  source: MarketingUploadSource;
}) {
  const parsed = parseCsv(input.csv);
  if (!parsed.rows.length) throw new Error("No rows were found in the uploaded CSV.");

  const summary = summarizeUpload(input.source, parsed.rows, {
    fileName: input.fileName || "uploaded-performance.csv",
    metricDate: input.metricDate || new Date().toISOString().slice(0, 10),
  });

  await recordComfortGuardiansHistoryEvent({
    eventType: input.source === "google_ads" ? "google_ads_upload" : "google_business_profile_upload",
    metricDate: summary.metricDate,
    payload: {
      columns: parsed.headers,
      fileName: summary.fileName,
      rows: parsed.rows.slice(0, 500),
      source: input.source,
    },
    source: input.source === "google_ads" ? "Google Ads upload" : "Google Business Profile upload",
    summary: summary as unknown as Record<string, unknown>,
  });

  return summary;
}

export async function getLatestMarketingPerformanceUploads(range: { endDate?: string; startDate?: string } = {}) {
  const events = await getComfortGuardiansHistory(250);
  const filteredEvents = events.filter((event) => eventMatchesRange(event.metricDate, range));
  const googleAds = filteredEvents.find((event) => event.eventType === "google_ads_upload")?.summary as MarketingUploadSummary | undefined;
  const googleBusinessProfile = filteredEvents.find((event) => event.eventType === "google_business_profile_upload")?.summary as MarketingUploadSummary | undefined;
  return {
    googleAds: googleAds || null,
    googleBusinessProfile: googleBusinessProfile || null,
  };
}

function eventMatchesRange(metricDate: string, range: { endDate?: string; startDate?: string }) {
  if (!range.startDate && !range.endDate) return true;
  const date = Date.parse(`${metricDate}T00:00:00.000Z`);
  if (Number.isNaN(date)) return true;
  if (range.startDate && date < Date.parse(`${range.startDate}T00:00:00.000Z`)) return false;
  if (range.endDate && date > Date.parse(`${range.endDate}T23:59:59.999Z`)) return false;
  return true;
}

function summarizeUpload(source: MarketingUploadSource, rows: Array<Record<string, string>>, metadata: { fileName: string; metricDate: string }): MarketingUploadSummary {
  if (source === "google_ads") {
    const clicks = sumColumn(rows, ["clicks"]);
    const impressions = sumColumn(rows, ["impressions", "impr"]);
    const cost = sumColumn(rows, ["cost", "cost usd", "cost $", "spend"]);
    const conversions = sumColumn(rows, ["conversions", "conv", "all conv", "all conversions"]);
    return {
      averageCpc: clicks ? round(cost / clicks, 2) : 0,
      clicks,
      conversions,
      cost,
      ctr: impressions ? round((clicks / impressions) * 100, 2) : 0,
      fileName: metadata.fileName,
      impressions,
      metricDate: metadata.metricDate,
      rows: rows.length,
      source,
      topRows: topRows(rows, ["campaign", "campaign name", "search term", "keyword", "ad group"], ["clicks", "cost", "conversions"]),
    };
  }

  const interactions = sumColumn(rows, ["interactions", "business interactions", "total interactions"]);
  const calls = sumColumn(rows, ["calls", "phone calls", "call clicks"]);
  const websiteClicks = sumColumn(rows, ["website clicks", "website", "website visits"]);
  const directionRequests = sumColumn(rows, ["directions", "direction requests"]);
  const messages = sumColumn(rows, ["messages", "message clicks"]);
  const impressions = sumColumn(rows, ["impressions", "views", "profile views", "search views", "maps views"]);
  return {
    calls,
    directionRequests,
    fileName: metadata.fileName,
    impressions,
    interactions,
    messages,
    metricDate: metadata.metricDate,
    rows: rows.length,
    source,
    topRows: topRows(rows, ["business", "location", "date", "search term"], ["interactions", "calls", "website clicks", "directions"]),
    websiteClicks,
  };
}

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);

  const headers = (rows.shift() || []).map(normalizeHeader);
  return {
    headers,
    rows: rows.map((values) => headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = values[index] || "";
      return record;
    }, {})).filter((record) => Object.values(record).some(Boolean)),
  };
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s$]/g, "").trim();
}

function sumColumn(rows: Array<Record<string, string>>, candidates: string[]) {
  const keys = candidates.map(normalizeHeader);
  return round(rows.reduce((total, row) => {
    const key = keys.find((candidate) => row[candidate] !== undefined);
    return total + parseNumber(key ? row[key] : "");
  }, 0), 2);
}

function parseNumber(value: string) {
  const cleaned = String(value || "").replace(/[$,%\s,]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function topRows(rows: Array<Record<string, string>>, labelCandidates: string[], metricCandidates: string[]) {
  const labels = labelCandidates.map(normalizeHeader);
  const metrics = metricCandidates.map(normalizeHeader);
  return rows.slice(0, 25).map((row) => {
    const labelKey = labels.find((candidate) => row[candidate]);
    const output: Record<string, string | number> = { name: labelKey ? row[labelKey] : "Row" };
    metrics.forEach((candidate) => {
      if (row[candidate] !== undefined) output[candidate] = parseNumber(row[candidate]);
    });
    return output;
  }).slice(0, 10);
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
