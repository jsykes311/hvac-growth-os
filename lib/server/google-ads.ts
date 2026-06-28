import crypto from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";

type PermissionMode = "Read Only" | "Draft Mode" | "Agency Mode" | "Owner Mode";

export type GoogleAdsMetricRow = {
  id: string;
  name: string;
  campaign?: string;
  adGroup?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgCpc: number;
  cost: number;
  conversions: number;
};

export type GoogleAdsDataPayload = {
  activeCustomerId: string;
  lastSyncAt: string;
  campaigns: GoogleAdsMetricRow[];
  adGroups: GoogleAdsMetricRow[];
  keywords: GoogleAdsMetricRow[];
  searchTerms: GoogleAdsMetricRow[];
  ads: GoogleAdsMetricRow[];
  assets: GoogleAdsMetricRow[];
  budgets: Array<{ id: string; name: string; amount: number; status: string }>;
  conversions: GoogleAdsMetricRow[];
};

type GoogleTokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
};

type GoogleAdsStore = {
  activeCustomerId: string;
  customerIds: string[];
  lastSyncAt: string;
  permissionMode: PermissionMode;
  tokenSet?: GoogleTokenSet;
  data?: GoogleAdsDataPayload;
};

const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";
const DEFAULT_API_VERSION = "v19";

export function googleAdsConfig() {
  return {
    apiVersion: process.env.GOOGLE_ADS_API_VERSION || DEFAULT_API_VERSION,
    clientId: process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
    encryptionKey: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "",
    loginCustomerId: cleanCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || ""),
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || "",
    tokenStorePath: process.env.GOOGLE_ADS_TOKEN_STORE_PATH || path.join(os.tmpdir(), "hvac-growth-os-google-ads-store.json"),
  };
}

export function isGoogleAdsConfigured() {
  const config = googleAdsConfig();
  return Boolean(config.clientId && config.clientSecret && config.developerToken && config.loginCustomerId && config.redirectUri && config.encryptionKey);
}

export function buildGoogleOAuthUrl({ origin, state }: { origin: string; state: string }) {
  const config = googleAdsConfig();
  const redirectUri = config.redirectUri || `${origin}/api/google-ads/callback`;
  const params = new URLSearchParams({
    access_type: "offline",
    client_id: config.clientId,
    include_granted_scopes: "true",
    prompt: "consent",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_ADS_SCOPE,
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode({ code, origin }: { code: string; origin: string }) {
  const config = googleAdsConfig();
  const redirectUri = config.redirectUri || `${origin}/api/google-ads/callback`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error || "Google OAuth token exchange failed.");
  }

  const existing = await loadGoogleAdsStore();
  const tokenSet: GoogleTokenSet = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || existing.tokenSet?.refreshToken || "",
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    scope: payload.scope || GOOGLE_ADS_SCOPE,
  };

  if (!tokenSet.refreshToken) {
    throw new Error("Google did not return a refresh token. Reconnect with consent enabled.");
  }

  const nextStore = {
    ...existing,
    permissionMode: "Read Only" as PermissionMode,
    tokenSet,
  };
  await saveGoogleAdsStore(nextStore);
  return nextStore;
}

export async function getGoogleAdsConnectionStatus() {
  const store = await loadGoogleAdsStore();
  return {
    googleAds: {
      activeCustomerId: store.activeCustomerId,
      connected: Boolean(store.tokenSet?.refreshToken),
      configured: isGoogleAdsConfigured(),
      customerIds: store.customerIds,
      lastSyncAt: store.lastSyncAt,
      permissionMode: store.permissionMode,
      tokenStored: Boolean(store.tokenSet?.refreshToken),
    },
  };
}

export async function setActiveGoogleAdsCustomer(customerId: string) {
  const cleaned = cleanCustomerId(customerId);
  if (!cleaned) throw new Error("Choose a valid Google Ads customer ID.");
  const store = await loadGoogleAdsStore();
  if (!store.customerIds.includes(cleaned)) {
    store.customerIds = [cleaned, ...store.customerIds];
  }
  store.activeCustomerId = cleaned;
  await saveGoogleAdsStore(store);
  return store;
}

export async function getStoredGoogleAdsData() {
  const store = await loadGoogleAdsStore();
  return store.data ?? emptyGoogleAdsData(store.activeCustomerId, store.lastSyncAt);
}

export async function syncGoogleAdsData() {
  const store = await loadGoogleAdsStore();
  if (!store.tokenSet?.refreshToken) throw new Error("Connect Google Ads before syncing data.");
  if (!isGoogleAdsConfigured()) throw new Error("Google Ads developer token, OAuth client, login customer ID, redirect URI, and token encryption env vars are required.");

  const accessToken = await getFreshAccessToken(store);
  const customerIds = await listAccessibleCustomers(accessToken);
  const activeCustomerId = store.activeCustomerId || customerIds[0] || "";
  if (!activeCustomerId) throw new Error("No accessible Google Ads customer accounts were returned.");

  const data = await fetchGoogleAdsData(accessToken, activeCustomerId);
  const nextStore: GoogleAdsStore = {
    ...store,
    activeCustomerId,
    customerIds,
    data,
    lastSyncAt: data.lastSyncAt,
  };
  await saveGoogleAdsStore(nextStore);
  return data;
}

async function fetchGoogleAdsData(accessToken: string, customerId: string): Promise<GoogleAdsDataPayload> {
  const [
    campaigns,
    adGroups,
    keywords,
    searchTerms,
    ads,
    assets,
    budgets,
    conversions,
  ] = await Promise.all([
    runGoogleAdsQuery(accessToken, customerId, campaignQuery()),
    runGoogleAdsQuery(accessToken, customerId, adGroupQuery()),
    runGoogleAdsQuery(accessToken, customerId, keywordQuery()),
    runGoogleAdsQuery(accessToken, customerId, searchTermQuery()),
    runGoogleAdsQuery(accessToken, customerId, adQuery()),
    runGoogleAdsQuery(accessToken, customerId, assetQuery()),
    runGoogleAdsQuery(accessToken, customerId, budgetQuery()),
    runGoogleAdsQuery(accessToken, customerId, conversionQuery()),
  ]);

  return {
    activeCustomerId: customerId,
    lastSyncAt: new Date().toISOString(),
    campaigns: campaigns.map((row) => metricRow(row, "campaign")),
    adGroups: adGroups.map((row) => metricRow(row, "adGroup")),
    keywords: keywords.map((row) => metricRow(row, "keyword")),
    searchTerms: searchTerms.map((row) => metricRow(row, "searchTerm")),
    ads: ads.map((row) => metricRow(row, "ad")),
    assets: assets.map((row) => metricRow(row, "asset")),
    budgets: budgets.map((row) => ({
      amount: microsToCurrency(Number(row.campaignBudget?.amountMicros ?? 0)),
      id: String(row.campaignBudget?.id ?? row.campaignBudget?.resourceName ?? crypto.randomUUID()),
      name: String(row.campaignBudget?.name ?? "Budget"),
      status: String(row.campaignBudget?.status ?? "UNKNOWN"),
    })),
    conversions: conversions.map((row) => metricRow(row, "conversion")),
  };
}

async function listAccessibleCustomers(accessToken: string) {
  const config = googleAdsConfig();
  const response = await fetch(`https://googleads.googleapis.com/${config.apiVersion}/customers:listAccessibleCustomers`, {
    headers: googleHeaders(accessToken),
  });
  const payload = (await response.json()) as { resourceNames?: string[]; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "Unable to list Google Ads customers.");
  return (payload.resourceNames ?? []).map((name) => cleanCustomerId(name.split("/").pop() || "")).filter(Boolean);
}

async function runGoogleAdsQuery(accessToken: string, customerId: string, query: string) {
  const config = googleAdsConfig();
  const response = await fetch(`https://googleads.googleapis.com/${config.apiVersion}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: { ...googleHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({ pageSize: 100, query }),
  });
  const payload = (await response.json()) as { error?: { message?: string }; results?: Array<Record<string, any>> };
  if (!response.ok) throw new Error(payload.error?.message || "Google Ads query failed.");
  return payload.results ?? [];
}

async function getFreshAccessToken(store: GoogleAdsStore) {
  if (store.tokenSet && store.tokenSet.expiresAt > Date.now() + 60_000) {
    return store.tokenSet.accessToken;
  }

  const config = googleAdsConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: store.tokenSet?.refreshToken || "",
    }),
  });
  const payload = (await response.json()) as { access_token?: string; error?: string; expires_in?: number; scope?: string };
  if (!response.ok || !payload.access_token) throw new Error(payload.error || "Unable to refresh Google access token.");

  store.tokenSet = {
    accessToken: payload.access_token,
    refreshToken: store.tokenSet?.refreshToken || "",
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    scope: payload.scope || store.tokenSet?.scope || GOOGLE_ADS_SCOPE,
  };
  await saveGoogleAdsStore(store);
  return payload.access_token;
}

function googleHeaders(accessToken: string) {
  const config = googleAdsConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": config.developerToken,
  };
  if (config.loginCustomerId) headers["login-customer-id"] = config.loginCustomerId;
  return headers;
}

async function loadGoogleAdsStore(): Promise<GoogleAdsStore> {
  const config = googleAdsConfig();
  try {
    const raw = await readFile(config.tokenStorePath, "utf8");
    const parsed = JSON.parse(raw) as { encrypted?: string };
    if (!parsed.encrypted) return defaultStore();
    return { ...defaultStore(), ...JSON.parse(decrypt(parsed.encrypted)) };
  } catch {
    return defaultStore();
  }
}

async function saveGoogleAdsStore(store: GoogleAdsStore) {
  const config = googleAdsConfig();
  if (!config.encryptionKey) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is required before storing Google OAuth tokens.");
  await mkdir(path.dirname(config.tokenStorePath), { recursive: true });
  await writeFile(config.tokenStorePath, JSON.stringify({ encrypted: encrypt(JSON.stringify(store)) }, null, 2), "utf8");
}

function encrypt(value: string) {
  const key = encryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

function decrypt(value: string) {
  const key = encryptionKey();
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function encryptionKey() {
  const configured = googleAdsConfig().encryptionKey;
  if (!configured) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is required.");
  return crypto.createHash("sha256").update(configured).digest();
}

function defaultStore(): GoogleAdsStore {
  return {
    activeCustomerId: "",
    customerIds: [],
    lastSyncAt: "",
    permissionMode: "Read Only",
  };
}

function emptyGoogleAdsData(activeCustomerId: string, lastSyncAt: string): GoogleAdsDataPayload {
  return {
    activeCustomerId,
    adGroups: [],
    ads: [],
    assets: [],
    budgets: [],
    campaigns: [],
    conversions: [],
    keywords: [],
    lastSyncAt,
    searchTerms: [],
  };
}

function metricRow(row: Record<string, any>, type: "campaign" | "adGroup" | "keyword" | "searchTerm" | "ad" | "asset" | "conversion"): GoogleAdsMetricRow {
  const metrics = row.metrics ?? {};
  const campaign = row.campaign ?? {};
  const adGroup = row.adGroup ?? {};
  const segments = row.segments ?? {};
  const criterion = row.adGroupCriterion ?? {};
  const ad = row.adGroupAd?.ad ?? {};
  const asset = row.asset ?? {};
  const conversionAction = row.conversionAction ?? {};
  const id =
    campaign.id ??
    adGroup.id ??
    criterion.criterionId ??
    ad.id ??
    asset.id ??
    conversionAction.id ??
    segments.searchTerm ??
    crypto.randomUUID();
  const name =
    type === "campaign" ? campaign.name :
    type === "adGroup" ? adGroup.name :
    type === "keyword" ? criterion.keyword?.text :
    type === "searchTerm" ? segments.searchTerm :
    type === "ad" ? ad.name || ad.resourceName :
    type === "asset" ? asset.name || asset.resourceName :
    conversionAction.name;

  const clicks = Number(metrics.clicks ?? 0);
  const impressions = Number(metrics.impressions ?? 0);
  const cost = microsToCurrency(Number(metrics.costMicros ?? 0));

  return {
    adGroup: adGroup.name,
    avgCpc: clicks ? cost / clicks : 0,
    campaign: campaign.name,
    clicks,
    conversions: Number(metrics.conversions ?? 0),
    cost,
    ctr: impressions ? clicks / impressions : 0,
    id: String(id),
    impressions,
    name: String(name || "Unnamed"),
  };
}

function campaignQuery() {
  return `
    SELECT campaign.id, campaign.name, campaign.status, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `;
}

function adGroupQuery() {
  return `
    SELECT campaign.name, ad_group.id, ad_group.name, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions
    FROM ad_group
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `;
}

function keywordQuery() {
  return `
    SELECT campaign.name, ad_group.name, ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions
    FROM keyword_view
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `;
}

function searchTermQuery() {
  return `
    SELECT campaign.name, ad_group.name, segments.search_term, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions
    FROM search_term_view
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `;
}

function adQuery() {
  return `
    SELECT campaign.name, ad_group.name, ad_group_ad.ad.id, ad_group_ad.ad.name, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions
    FROM ad_group_ad
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `;
}

function assetQuery() {
  return `
    SELECT asset.id, asset.name, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions
    FROM asset
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY metrics.impressions DESC
    LIMIT 100
  `;
}

function budgetQuery() {
  return `
    SELECT campaign_budget.id, campaign_budget.name, campaign_budget.amount_micros, campaign_budget.status
    FROM campaign_budget
    LIMIT 100
  `;
}

function conversionQuery() {
  return `
    SELECT conversion_action.id, conversion_action.name, metrics.conversions, metrics.clicks, metrics.impressions, metrics.cost_micros
    FROM conversion_action
    WHERE segments.date DURING LAST_30_DAYS
    LIMIT 100
  `;
}

function microsToCurrency(value: number) {
  return value / 1_000_000;
}

function cleanCustomerId(value: string) {
  return value.replace(/[^0-9]/g, "");
}
