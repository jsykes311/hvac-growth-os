import zlib from "zlib";
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
  files?: Array<{ content: string; fileName: string }>;
  fileName: string;
  metricDate?: string;
  source: MarketingUploadSource;
}) {
  const uploadFiles = input.files?.length ? input.files : [{ content: input.csv, fileName: input.fileName }];
  const parsedFiles = uploadFiles.flatMap((file) => parseUploadFile(file.content, file.fileName));
  const parsed = mergeParsedCsvFiles(parsedFiles);
  if (!parsed.rows.length) throw new Error("No CSV rows were found in the uploaded file package.");

  const summary = summarizeUpload(input.source, parsed.rows, {
    fileName: uploadFiles.length > 1 ? `${input.fileName || "performance-upload"} (${uploadFiles.length} files)` : input.fileName || "uploaded-performance.csv",
    metricDate: input.metricDate || new Date().toISOString().slice(0, 10),
  });

  await recordComfortGuardiansHistoryEvent({
    eventType: input.source === "google_ads" ? "google_ads_upload" : "google_business_profile_upload",
    metricDate: summary.metricDate,
    payload: {
      columns: parsed.headers,
      extractedFiles: parsedFiles.map((file) => ({ fileName: file.fileName, rows: file.parsed.rows.length })),
      fileName: summary.fileName,
      rows: parsed.rows.slice(0, 500),
      source: input.source,
    },
    source: input.source === "google_ads" ? "Google Ads upload" : "Google Business Profile upload",
    summary: summary as unknown as Record<string, unknown>,
  });

  return summary;
}

function parseUploadFile(content: string, fileName: string) {
  return fileName.toLowerCase().endsWith(".zip")
    ? parseZipCsvFiles(Buffer.from(content, "base64"))
    : [{ fileName, parsed: parseCsv(content) }];
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
    const metricRows = preferredGoogleAdsMetricRows(rows, ["time_series", "campaigns", "devices", "search_keywords", "searches(search"], ["clicks", "impressions", "cost", "spend"]);
    const conversionRows = preferredGoogleAdsMetricRows(rows, ["campaigns", "time_series", "searches(search", "search_keywords"], ["conversions", "conv", "all conv", "all conversions"]);
    const detailRows = preferredGoogleAdsMetricRows(rows, ["campaigns", "search_keywords", "searches(search", "time_series"], ["clicks", "cost", "conversions", "conv", "all conversions"]);
    const clicks = sumColumn(metricRows, ["clicks"]);
    const impressions = sumColumn(metricRows, ["impressions", "impr"]);
    const cost = sumColumn(metricRows, ["cost", "cost usd", "cost $", "spend"]);
    const conversions = sumColumn(conversionRows, ["conversions", "conv", "all conv", "all conversions"]);
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
      topRows: topRows(detailRows, ["campaign", "campaign name", "search", "search term", "search keyword", "keyword", "ad group"], ["clicks", "cost", "conversions"]),
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

function mergeParsedCsvFiles(files: Array<{ fileName: string; parsed: ReturnType<typeof parseCsv> }>) {
  const headers = [...new Set(files.flatMap((file) => file.parsed.headers))];
  return {
    headers,
    rows: dedupeRows(files.flatMap((file) => file.parsed.rows.map((row) => ({
      ...row,
      source_file: file.fileName,
    })))),
  };
}

function preferredGoogleAdsMetricRows(rows: Array<Record<string, string>>, filePriorities: string[], requiredColumns: string[]) {
  const rowsWithSource = rows.filter((row) => row.source_file);
  if (!rowsWithSource.length) return rows;
  for (const priority of filePriorities) {
    const normalizedPriority = normalizeFileName(priority);
    const selected = rowsWithSource.filter((row) => normalizeFileName(row.source_file).includes(normalizedPriority));
    if (selected.length && hasAnyColumn(selected, requiredColumns)) {
      return selected;
    }
  }
  return rowsWithSource.filter((row) => hasAnyColumn([row], requiredColumns));
}

function normalizeFileName(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function hasAnyColumn(rows: Array<Record<string, string>>, candidates: string[]) {
  const keys = candidates.map(normalizeHeader);
  return rows.some((row) => keys.some((key) => row[key] !== undefined));
}

function dedupeRows(rows: Array<Record<string, string>>) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = JSON.stringify(Object.entries(row).sort(([a], [b]) => a.localeCompare(b)));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseZipCsvFiles(buffer: Buffer) {
  const files: Array<{ fileName: string; parsed: ReturnType<typeof parseCsv> }> = [];
  const centralEntries = readZipCentralDirectory(buffer);
  if (centralEntries.length) {
    for (const entry of centralEntries) {
      const content = readZipEntry(buffer, entry);
      if (content && /\.csv$/i.test(entry.fileName)) {
        const parsed = parseCsv(stripBom(content.toString("utf8")));
        if (parsed.rows.length) files.push({ fileName: entry.fileName, parsed });
      }
    }
    if (files.length) return files;
  }

  let offset = 0;

  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;

    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const uncompressedSize = buffer.readUInt32LE(offset + 22);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const fileName = buffer.subarray(offset + 30, offset + 30 + fileNameLength).toString("utf8");
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length || compressedSize === 0) {
      offset = Math.max(dataEnd, dataStart);
      continue;
    }

    const compressed = buffer.subarray(dataStart, dataEnd);
    const content = method === 0
      ? compressed
      : method === 8
        ? zlib.inflateRawSync(compressed)
        : null;

    if (content && /\.csv$/i.test(fileName) && uncompressedSize !== 0) {
      const parsed = parseCsv(stripBom(content.toString("utf8")));
      if (parsed.rows.length) files.push({ fileName, parsed });
    }

    offset = dataEnd;
  }

  if (!files.length) throw new Error("The ZIP did not contain readable CSV files. Export as CSV files inside a standard ZIP and try again.");
  return files;
}

function readZipCentralDirectory(buffer: Buffer) {
  const entries: Array<{ compressedSize: number; fileName: string; localHeaderOffset: number; method: number; uncompressedSize: number }> = [];
  let offset = 0;
  while (offset + 46 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x02014b50) {
      offset += 1;
      continue;
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    entries.push({ compressedSize, fileName, localHeaderOffset, method, uncompressedSize });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function readZipEntry(buffer: Buffer, entry: { compressedSize: number; localHeaderOffset: number; method: number; uncompressedSize: number }) {
  const offset = entry.localHeaderOffset;
  if (offset + 30 > buffer.length || buffer.readUInt32LE(offset) !== 0x04034b50) return null;
  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const dataEnd = dataStart + entry.compressedSize;
  if (dataEnd > buffer.length || entry.compressedSize === 0 || entry.uncompressedSize === 0) return null;
  const compressed = buffer.subarray(dataStart, dataEnd);
  if (entry.method === 0) return compressed;
  if (entry.method === 8) return zlib.inflateRawSync(compressed);
  return null;
}

function stripBom(value: string) {
  return value.replace(/^\uFEFF/, "");
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
