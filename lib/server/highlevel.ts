import crypto from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";

type PermissionMode = "Read Only" | "Draft Mode" | "Agency Mode" | "Owner Mode";

type HighLevelTokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  locationId: string;
  scope: string;
};

export type HighLevelRecord = {
  id: string;
  name: string;
  status?: string;
  source?: string;
  stage?: string;
  value?: number;
  createdAt?: string;
};

export type RevenueFunnelPayload = {
  googleAdsClicks: number;
  googleAdsSpend: number;
  crmLeads: number;
  phoneCalls: number;
  leads: number;
  estimates: number;
  wonOpportunities: number;
  wonJobs: number;
  pipelineValue: number;
  revenue: number;
  estimatedRevenue: number;
  roi: number;
  leadSources: Array<{ source: string; count: number; value: number }>;
  opportunityStages: Array<{ stage: string; count: number; value: number }>;
  campaignAttribution: Array<{ campaign: string; leads: number; value: number }>;
};

export type HighLevelSnapshot = {
  closedWon: number;
  contacts: number;
  estimatedRevenue: number;
  openOpportunities: number;
  phoneCalls: number;
  pipelineValue: number;
  syncedAt: string;
  wonJobs: number;
};

export type HighLevelDataPayload = {
  activeLocationId: string;
  connectedLocation: string;
  lastSyncAt: string;
  locations: HighLevelRecord[];
  contacts: HighLevelRecord[];
  opportunities: HighLevelRecord[];
  opportunityStages: HighLevelRecord[];
  pipelines: HighLevelRecord[];
  conversations: HighLevelRecord[];
  calls: HighLevelRecord[];
  calendars: HighLevelRecord[];
  forms: HighLevelRecord[];
  tags: HighLevelRecord[];
  workflows: HighLevelRecord[];
  customFields: HighLevelRecord[];
  revenueFunnel: RevenueFunnelPayload;
  snapshots: HighLevelSnapshot[];
};

type HighLevelStore = {
  activeLocationId: string;
  connectedLocation: string;
  connectionSource: "OAuth" | "API Key" | "";
  lastSyncAt: string;
  permissionMode: PermissionMode;
  snapshots: HighLevelSnapshot[];
  tokenSet?: HighLevelTokenSet;
  data?: HighLevelDataPayload;
};

const HIGHLEVEL_BASE_URL = "https://services.leadconnectorhq.com";
const HIGHLEVEL_AUTH_URL = "https://marketplace.gohighlevel.com/oauth/chooselocation";
const DEFAULT_VERSION = "2021-07-28";
const DEFAULT_SCOPES = [
  "locations.readonly",
  "contacts.readonly",
  "opportunities.readonly",
  "conversations.readonly",
  "calendars.readonly",
  "forms.readonly",
  "tags.readonly",
  "workflows.readonly",
  "custom-fields.readonly",
].join(" ");

export function highLevelConfig() {
  return {
    apiVersion: process.env.HIGHLEVEL_API_VERSION || DEFAULT_VERSION,
    apiKey: process.env.HIGHLEVEL_API_KEY || "",
    clientId: process.env.HIGHLEVEL_CLIENT_ID || "",
    clientSecret: process.env.HIGHLEVEL_CLIENT_SECRET || "",
    encryptionKey: process.env.HIGHLEVEL_TOKEN_ENCRYPTION_KEY || process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "",
    locationId: process.env.HIGHLEVEL_LOCATION_ID || "",
    redirectUri: process.env.HIGHLEVEL_OAUTH_REDIRECT_URI || "",
    scopes: process.env.HIGHLEVEL_OAUTH_SCOPES || DEFAULT_SCOPES,
    tokenStorePath: process.env.HIGHLEVEL_TOKEN_STORE_PATH || path.join(os.tmpdir(), "hvac-growth-os-highlevel-store.json"),
  };
}

export function highLevelSetupStatus() {
  const config = highLevelConfig();
  const oauthReady = Boolean(config.clientId && config.clientSecret && config.redirectUri);
  const apiKeyReady = Boolean(config.apiKey && config.locationId);
  const items = [
    {
      configured: Boolean(config.clientId) || apiKeyReady,
      detail: "Preferred path for sending users to HighLevel OAuth consent. Optional when API key fallback is configured.",
      envVar: "HIGHLEVEL_CLIENT_ID",
      label: "HighLevel OAuth client ID",
    },
    {
      configured: Boolean(config.clientSecret) || apiKeyReady,
      detail: "Preferred path for exchanging OAuth authorization codes. Optional when API key fallback is configured.",
      envVar: "HIGHLEVEL_CLIENT_SECRET",
      label: "HighLevel OAuth client secret",
    },
    {
      configured: Boolean(config.redirectUri) || apiKeyReady,
      detail: "Must match the redirect URI configured in the HighLevel marketplace app. Optional when API key fallback is configured.",
      envVar: "HIGHLEVEL_OAUTH_REDIRECT_URI",
      label: "HighLevel OAuth redirect URI",
    },
    {
      configured: Boolean(config.apiKey) || oauthReady,
      detail: "Fallback read-only connection when OAuth is not available for the account.",
      envVar: "HIGHLEVEL_API_KEY",
      label: "HighLevel API key fallback",
    },
    {
      configured: Boolean(config.locationId) || oauthReady,
      detail: "Required with API key fallback so HVAC Growth OS knows which HighLevel location to sync.",
      envVar: "HIGHLEVEL_LOCATION_ID",
      label: "HighLevel location ID",
    },
    {
      configured: Boolean(config.encryptionKey),
      detail: "Required to encrypt the stored HighLevel refresh token. Use a dedicated HighLevel key or the shared GOOGLE_TOKEN_ENCRYPTION_KEY.",
      envVar: "HIGHLEVEL_TOKEN_ENCRYPTION_KEY",
      label: "HighLevel token encryption key",
    },
  ];

  return {
    items,
    missingItems: items.filter((item) => !item.configured).map((item) => item.envVar),
    ready: Boolean(config.encryptionKey && (oauthReady || apiKeyReady)),
  };
}

export function isHighLevelConfigured() {
  return highLevelSetupStatus().ready;
}

export function buildHighLevelOAuthUrl({ origin, state }: { origin: string; state: string }) {
  const config = highLevelConfig();
  const redirectUri = config.redirectUri || `${origin}/api/highlevel/callback`;
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes,
    state,
  });

  return `${HIGHLEVEL_AUTH_URL}?${params.toString()}`;
}

export async function exchangeHighLevelCode({ code, origin }: { code: string; origin: string }) {
  const config = highLevelConfig();
  const redirectUri = config.redirectUri || `${origin}/api/highlevel/callback`;
  const response = await fetch(`${HIGHLEVEL_BASE_URL}/oauth/token`, {
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
    locationId?: string;
    location_id?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error || "HighLevel OAuth token exchange failed.");
  }

  const existing = await loadHighLevelStore();
  const tokenSet: HighLevelTokenSet = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || existing.tokenSet?.refreshToken || "",
    expiresAt: Date.now() + (payload.expires_in ?? 86_400) * 1000,
    locationId: payload.locationId || payload.location_id || existing.activeLocationId || "",
    scope: payload.scope || config.scopes,
  };

  if (!tokenSet.refreshToken) throw new Error("HighLevel did not return a refresh token.");

  const nextStore: HighLevelStore = {
    ...existing,
    activeLocationId: tokenSet.locationId || existing.activeLocationId,
    permissionMode: "Read Only",
    tokenSet,
  };
  await saveHighLevelStore(nextStore);
  return nextStore;
}

export async function getHighLevelConnectionStatus() {
  const store = await loadHighLevelStore();
  const setup = highLevelSetupStatus();
  const config = highLevelConfig();
  const hasApiKeyFallback = Boolean(config.apiKey && config.locationId);
  const connected = Boolean(store.tokenSet?.refreshToken || hasApiKeyFallback);
  const data = store.data;
  return {
    highLevel: {
      activeLocationId: store.activeLocationId || config.locationId,
      closedWon: data?.revenueFunnel.wonOpportunities ?? 0,
      connected,
      connectedLocation: store.connectedLocation,
      connectionSource: store.tokenSet?.refreshToken ? "OAuth" : hasApiKeyFallback ? "API Key" : "",
      configured: setup.ready,
      lastSyncAt: store.lastSyncAt,
      leadSources: data?.revenueFunnel.leadSources ?? [],
      openOpportunities: data ? Math.max(data.opportunities.length - data.revenueFunnel.wonOpportunities, 0) : 0,
      permissionMode: store.permissionMode,
      pipelineValue: data?.revenueFunnel.pipelineValue ?? 0,
      setup,
      tokenStored: Boolean(store.tokenSet?.refreshToken || hasApiKeyFallback),
      totalContacts: data?.contacts.length ?? 0,
    },
  };
}

export async function getStoredHighLevelData() {
  const store = await loadHighLevelStore();
  return store.data ?? emptyHighLevelData(store.activeLocationId, store.connectedLocation, store.lastSyncAt, store.snapshots);
}

export async function syncHighLevelData() {
  const store = await loadHighLevelStore();
  const config = highLevelConfig();
  const apiKeyFallbackReady = Boolean(config.apiKey && config.locationId);
  if (!store.tokenSet?.refreshToken && !apiKeyFallbackReady) throw new Error("Connect HighLevel with OAuth or configure the read-only API key fallback before syncing data.");
  if (!isHighLevelConfigured()) throw new Error("HighLevel OAuth or API key env vars and token encryption are required.");

  const accessToken = apiKeyFallbackReady && !store.tokenSet?.refreshToken ? config.apiKey : await getFreshHighLevelAccessToken(store);
  const locationId = store.activeLocationId || store.tokenSet?.locationId || config.locationId;
  if (!locationId) throw new Error("HighLevel did not return a connected location. Reconnect and choose a location.");

  const previousSnapshots = store.snapshots || store.data?.snapshots || [];
  const data = await fetchHighLevelData(accessToken, locationId, previousSnapshots);
  const nextStore: HighLevelStore = {
    ...store,
    activeLocationId: locationId,
    connectedLocation: data.connectedLocation,
    connectionSource: apiKeyFallbackReady && !store.tokenSet?.refreshToken ? "API Key" : "OAuth",
    data,
    lastSyncAt: data.lastSyncAt,
    snapshots: data.snapshots,
  };
  await saveHighLevelStore(nextStore);
  return data;
}

async function fetchHighLevelData(accessToken: string, locationId: string, previousSnapshots: HighLevelSnapshot[]): Promise<HighLevelDataPayload> {
  const [
    location,
    contacts,
    opportunities,
    pipelines,
    conversations,
    calls,
    calendars,
    forms,
    tags,
    workflows,
    customFields,
  ] = await Promise.all([
    highLevelGet(accessToken, `/locations/${locationId}`),
    highLevelGet(accessToken, `/contacts/?locationId=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/opportunities/search?location_id=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/conversations/search?locationId=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/conversations/search?locationId=${encodeURIComponent(locationId)}&type=CALL`),
    highLevelGet(accessToken, `/calendars/?locationId=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/forms/?locationId=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/locations/${locationId}/tags`),
    highLevelGet(accessToken, `/workflows/?locationId=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/locations/${locationId}/customFields`),
  ]);

  const locationRecord = normalizeRecords(location, ["location", "locations"])[0] ?? { id: locationId, name: locationId };
  const normalizedContacts = normalizeRecords(contacts, ["contacts"]);
  const normalizedOpportunities = normalizeRecords(opportunities, ["opportunities"]);
  const normalizedPipelines = normalizeRecords(pipelines, ["pipelines"]);
  const normalizedCalls = normalizeRecords(calls, ["conversations", "calls"]).filter((item) => /call|phone/i.test(`${item.status} ${item.name} ${item.source}`));
  const normalizedOpportunityStages = normalizeOpportunityStages(pipelines);
  const revenueFunnel = buildRevenueFunnel(normalizedContacts, normalizedOpportunities, normalizedCalls);
  const lastSyncAt = new Date().toISOString();
  const snapshots = buildSnapshots(previousSnapshots, lastSyncAt, {
    contacts: normalizedContacts,
    opportunities: normalizedOpportunities,
    phoneCalls: normalizedCalls.length,
    revenueFunnel,
  });

  return {
    activeLocationId: locationId,
    calendars: normalizeRecords(calendars, ["calendars"]),
    calls: normalizedCalls,
    connectedLocation: locationRecord.name || locationId,
    contacts: normalizedContacts,
    conversations: normalizeRecords(conversations, ["conversations"]),
    customFields: normalizeRecords(customFields, ["customFields", "custom_fields"]),
    forms: normalizeRecords(forms, ["forms"]),
    lastSyncAt,
    locations: [locationRecord],
    opportunities: normalizedOpportunities,
    opportunityStages: normalizedOpportunityStages,
    pipelines: normalizedPipelines,
    revenueFunnel,
    snapshots,
    tags: normalizeRecords(tags, ["tags"]),
    workflows: normalizeRecords(workflows, ["workflows"]),
  };
}

async function highLevelGet(accessToken: string, endpoint: string) {
  try {
    const response = await fetch(`${HIGHLEVEL_BASE_URL}${endpoint}`, {
      headers: highLevelHeaders(accessToken),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("HighLevel read failed", endpoint, payload);
      return {};
    }
    return payload;
  } catch (error) {
    console.error("HighLevel read failed", endpoint, error);
    return {};
  }
}

async function getFreshHighLevelAccessToken(store: HighLevelStore) {
  if (store.tokenSet && store.tokenSet.expiresAt > Date.now() + 60_000) {
    return store.tokenSet.accessToken;
  }

  const config = highLevelConfig();
  const response = await fetch(`${HIGHLEVEL_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: store.tokenSet?.refreshToken || "",
    }),
  });
  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
  };
  if (!response.ok || !payload.access_token) throw new Error(payload.error || "Unable to refresh HighLevel access token.");

  store.tokenSet = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || store.tokenSet?.refreshToken || "",
    expiresAt: Date.now() + (payload.expires_in ?? 86_400) * 1000,
    locationId: store.tokenSet?.locationId || store.activeLocationId,
    scope: payload.scope || store.tokenSet?.scope || config.scopes,
  };
  await saveHighLevelStore(store);
  return payload.access_token;
}

function highLevelHeaders(accessToken: string) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
    Version: highLevelConfig().apiVersion,
  };
}

function normalizeOpportunityStages(payload: any): HighLevelRecord[] {
  const pipelines = firstArray(payload, ["pipelines"]);
  return pipelines.flatMap((pipeline: any) => {
    const pipelineName = pipeline.name || pipeline.title || pipeline.id || pipeline._id || "Pipeline";
    const stages = Array.isArray(pipeline.stages) ? pipeline.stages : Array.isArray(pipeline.pipelineStages) ? pipeline.pipelineStages : [];
    return stages.map((stage: any) => normalizeRecord({
      ...stage,
      name: `${pipelineName} / ${stage.name || stage.title || stage.id || "Stage"}`,
      pipelineId: pipeline.id || pipeline._id,
    }));
  });
}

function normalizeRecords(payload: any, keys: string[]): HighLevelRecord[] {
  const raw = firstArray(payload, keys);
  if (!raw.length && payload && typeof payload === "object" && (payload.id || payload._id || payload.locationId)) {
    return [normalizeRecord(payload)];
  }
  return raw.map(normalizeRecord);
}

function firstArray(payload: any, keys: string[]) {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeRecord(item: any): HighLevelRecord {
  const firstName = item.firstName || item.first_name || "";
  const lastName = item.lastName || item.last_name || "";
  const name = item.name || item.fullName || item.title || [firstName, lastName].filter(Boolean).join(" ") || item.email || item.phone || item.id || item._id || "Unnamed";
  return {
    createdAt: item.createdAt || item.dateAdded || item.created_at || item.updatedAt || "",
    id: String(item.id || item._id || item.locationId || item.pipelineId || item.name || crypto.randomUUID()),
    name: String(name),
    source: item.source || item.contactSource || item.attributionSource || item.campaignName || item.campaign || "",
    stage: item.pipelineStageId || item.stageId || item.status || item.stage || item.pipelineStageName || "",
    status: item.status || item.type || item.eventType || "",
    value: Number(item.monetaryValue ?? item.value ?? item.pipelineValue ?? item.opportunityValue ?? 0),
  };
}

function buildRevenueFunnel(contacts: HighLevelRecord[], opportunities: HighLevelRecord[], calls: HighLevelRecord[]): RevenueFunnelPayload {
  const estimates = opportunities.filter((item) => /estimate|proposal|quoted|sent/i.test(`${item.stage} ${item.status} ${item.name}`));
  const won = opportunities.filter((item) => /won|closed won|sold/i.test(`${item.stage} ${item.status}`));
  const revenue = sum(won.map((item) => item.value || 0));
  const pipelineValue = sum(opportunities.map((item) => item.value || 0));
  const estimatedRevenue = revenue || sum([...won, ...estimates].map((item) => item.value || 0));
  const googleAdsSpend = 0;

  return {
    campaignAttribution: groupRecords([...contacts, ...opportunities], "source").slice(0, 8).map((row) => ({ campaign: row.label, leads: row.count, value: row.value })),
    crmLeads: contacts.length,
    estimates: estimates.length,
    estimatedRevenue,
    googleAdsClicks: 0,
    googleAdsSpend,
    leadSources: groupRecords([...contacts, ...opportunities], "source").slice(0, 8).map((row) => ({ source: row.label, count: row.count, value: row.value })),
    leads: contacts.length,
    opportunityStages: groupRecords(opportunities, "stage").slice(0, 10).map((row) => ({ stage: row.label, count: row.count, value: row.value })),
    phoneCalls: calls.length,
    pipelineValue,
    revenue,
    roi: googleAdsSpend ? Number((revenue / googleAdsSpend).toFixed(2)) : 0,
    wonJobs: won.length,
    wonOpportunities: won.length,
  };
}

function buildSnapshots(
  previousSnapshots: HighLevelSnapshot[],
  syncedAt: string,
  data: {
    contacts: HighLevelRecord[];
    opportunities: HighLevelRecord[];
    phoneCalls: number;
    revenueFunnel: RevenueFunnelPayload;
  },
) {
  const snapshot: HighLevelSnapshot = {
    closedWon: data.revenueFunnel.wonOpportunities,
    contacts: data.contacts.length,
    estimatedRevenue: data.revenueFunnel.estimatedRevenue,
    openOpportunities: Math.max(data.opportunities.length - data.revenueFunnel.wonOpportunities, 0),
    phoneCalls: data.phoneCalls,
    pipelineValue: data.revenueFunnel.pipelineValue,
    syncedAt,
    wonJobs: data.revenueFunnel.wonJobs,
  };
  return [snapshot, ...previousSnapshots.filter((item) => item.syncedAt !== syncedAt)].slice(0, 24);
}

function groupRecords(records: HighLevelRecord[], field: "source" | "stage") {
  const grouped = new Map<string, { count: number; label: string; value: number }>();
  for (const record of records) {
    const label = (record[field] || "Unattributed").trim() || "Unattributed";
    const current = grouped.get(label) || { count: 0, label, value: 0 };
    current.count += 1;
    current.value += record.value || 0;
    grouped.set(label, current);
  }
  return [...grouped.values()].sort((a, b) => b.value - a.value || b.count - a.count);
}

async function loadHighLevelStore(): Promise<HighLevelStore> {
  const config = highLevelConfig();
  try {
    const raw = await readFile(config.tokenStorePath, "utf8");
    const parsed = JSON.parse(raw) as { encrypted?: string };
    if (!parsed.encrypted) return defaultStore();
    return { ...defaultStore(), ...JSON.parse(decrypt(parsed.encrypted)) };
  } catch {
    return defaultStore();
  }
}

async function saveHighLevelStore(store: HighLevelStore) {
  const config = highLevelConfig();
  if (!config.encryptionKey) throw new Error("HIGHLEVEL_TOKEN_ENCRYPTION_KEY is required before storing HighLevel OAuth tokens.");
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
  const configured = highLevelConfig().encryptionKey;
  if (!configured) throw new Error("HIGHLEVEL_TOKEN_ENCRYPTION_KEY is required.");
  return crypto.createHash("sha256").update(configured).digest();
}

function defaultStore(): HighLevelStore {
  return {
    activeLocationId: "",
    connectedLocation: "",
    connectionSource: "",
    lastSyncAt: "",
    permissionMode: "Read Only",
    snapshots: [],
  };
}

function emptyHighLevelData(activeLocationId: string, connectedLocation: string, lastSyncAt: string, snapshots: HighLevelSnapshot[] = []): HighLevelDataPayload {
  return {
    activeLocationId,
    calendars: [],
    calls: [],
    connectedLocation,
    contacts: [],
    conversations: [],
    customFields: [],
    forms: [],
    lastSyncAt,
    locations: [],
    opportunities: [],
    opportunityStages: [],
    pipelines: [],
    revenueFunnel: buildRevenueFunnel([], [], []),
    snapshots,
    tags: [],
    workflows: [],
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
