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
  googleAdsSpend: number;
  leads: number;
  estimates: number;
  wonOpportunities: number;
  pipelineValue: number;
  revenue: number;
  roi: number;
  leadSources: Array<{ source: string; count: number; value: number }>;
  opportunityStages: Array<{ stage: string; count: number; value: number }>;
  campaignAttribution: Array<{ campaign: string; leads: number; value: number }>;
};

export type HighLevelDataPayload = {
  activeLocationId: string;
  connectedLocation: string;
  lastSyncAt: string;
  locations: HighLevelRecord[];
  contacts: HighLevelRecord[];
  opportunities: HighLevelRecord[];
  pipelines: HighLevelRecord[];
  conversations: HighLevelRecord[];
  calendars: HighLevelRecord[];
  forms: HighLevelRecord[];
  tags: HighLevelRecord[];
  workflows: HighLevelRecord[];
  customFields: HighLevelRecord[];
  revenueFunnel: RevenueFunnelPayload;
};

type HighLevelStore = {
  activeLocationId: string;
  connectedLocation: string;
  lastSyncAt: string;
  permissionMode: PermissionMode;
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
    clientId: process.env.HIGHLEVEL_CLIENT_ID || "",
    clientSecret: process.env.HIGHLEVEL_CLIENT_SECRET || "",
    encryptionKey: process.env.HIGHLEVEL_TOKEN_ENCRYPTION_KEY || process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "",
    redirectUri: process.env.HIGHLEVEL_OAUTH_REDIRECT_URI || "",
    scopes: process.env.HIGHLEVEL_OAUTH_SCOPES || DEFAULT_SCOPES,
    tokenStorePath: process.env.HIGHLEVEL_TOKEN_STORE_PATH || path.join(os.tmpdir(), "hvac-growth-os-highlevel-store.json"),
  };
}

export function highLevelSetupStatus() {
  const config = highLevelConfig();
  const items = [
    {
      configured: Boolean(config.clientId),
      detail: "Required to send users to HighLevel OAuth consent.",
      envVar: "HIGHLEVEL_CLIENT_ID",
      label: "HighLevel OAuth client ID",
    },
    {
      configured: Boolean(config.clientSecret),
      detail: "Required to exchange the authorization code for HighLevel tokens.",
      envVar: "HIGHLEVEL_CLIENT_SECRET",
      label: "HighLevel OAuth client secret",
    },
    {
      configured: Boolean(config.redirectUri),
      detail: "Must match the redirect URI configured in the HighLevel marketplace app.",
      envVar: "HIGHLEVEL_OAUTH_REDIRECT_URI",
      label: "HighLevel OAuth redirect URI",
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
    ready: items.every((item) => item.configured),
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
  return {
    highLevel: {
      activeLocationId: store.activeLocationId,
      connected: Boolean(store.tokenSet?.refreshToken),
      connectedLocation: store.connectedLocation,
      configured: setup.ready,
      lastSyncAt: store.lastSyncAt,
      permissionMode: store.permissionMode,
      setup,
      tokenStored: Boolean(store.tokenSet?.refreshToken),
    },
  };
}

export async function getStoredHighLevelData() {
  const store = await loadHighLevelStore();
  return store.data ?? emptyHighLevelData(store.activeLocationId, store.connectedLocation, store.lastSyncAt);
}

export async function syncHighLevelData() {
  const store = await loadHighLevelStore();
  if (!store.tokenSet?.refreshToken) throw new Error("Connect HighLevel before syncing data.");
  if (!isHighLevelConfigured()) throw new Error("HighLevel OAuth env vars and token encryption are required.");

  const accessToken = await getFreshHighLevelAccessToken(store);
  const locationId = store.activeLocationId || store.tokenSet.locationId;
  if (!locationId) throw new Error("HighLevel did not return a connected location. Reconnect and choose a location.");

  const data = await fetchHighLevelData(accessToken, locationId);
  const nextStore: HighLevelStore = {
    ...store,
    activeLocationId: locationId,
    connectedLocation: data.connectedLocation,
    data,
    lastSyncAt: data.lastSyncAt,
  };
  await saveHighLevelStore(nextStore);
  return data;
}

async function fetchHighLevelData(accessToken: string, locationId: string): Promise<HighLevelDataPayload> {
  const [
    location,
    contacts,
    opportunities,
    pipelines,
    conversations,
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
    highLevelGet(accessToken, `/calendars/?locationId=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/forms/?locationId=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/locations/${locationId}/tags`),
    highLevelGet(accessToken, `/workflows/?locationId=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/locations/${locationId}/customFields`),
  ]);

  const locationRecord = normalizeRecords(location, ["location", "locations"])[0] ?? { id: locationId, name: locationId };
  const normalizedContacts = normalizeRecords(contacts, ["contacts"]);
  const normalizedOpportunities = normalizeRecords(opportunities, ["opportunities"]);

  return {
    activeLocationId: locationId,
    calendars: normalizeRecords(calendars, ["calendars"]),
    connectedLocation: locationRecord.name || locationId,
    contacts: normalizedContacts,
    conversations: normalizeRecords(conversations, ["conversations"]),
    customFields: normalizeRecords(customFields, ["customFields", "custom_fields"]),
    forms: normalizeRecords(forms, ["forms"]),
    lastSyncAt: new Date().toISOString(),
    locations: [locationRecord],
    opportunities: normalizedOpportunities,
    pipelines: normalizeRecords(pipelines, ["pipelines"]),
    revenueFunnel: buildRevenueFunnel(normalizedContacts, normalizedOpportunities),
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

function buildRevenueFunnel(contacts: HighLevelRecord[], opportunities: HighLevelRecord[]): RevenueFunnelPayload {
  const estimates = opportunities.filter((item) => /estimate|proposal|quoted|sent/i.test(`${item.stage} ${item.status} ${item.name}`));
  const won = opportunities.filter((item) => /won|closed won|sold/i.test(`${item.stage} ${item.status}`));
  const revenue = sum(won.map((item) => item.value || 0));
  const pipelineValue = sum(opportunities.map((item) => item.value || 0));
  const googleAdsSpend = 0;

  return {
    campaignAttribution: groupRecords([...contacts, ...opportunities], "source").slice(0, 8).map((row) => ({ campaign: row.label, leads: row.count, value: row.value })),
    estimates: estimates.length,
    googleAdsSpend,
    leadSources: groupRecords([...contacts, ...opportunities], "source").slice(0, 8).map((row) => ({ source: row.label, count: row.count, value: row.value })),
    leads: contacts.length,
    opportunityStages: groupRecords(opportunities, "stage").slice(0, 10).map((row) => ({ stage: row.label, count: row.count, value: row.value })),
    pipelineValue,
    revenue,
    roi: googleAdsSpend ? Number((revenue / googleAdsSpend).toFixed(2)) : 0,
    wonOpportunities: won.length,
  };
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
    lastSyncAt: "",
    permissionMode: "Read Only",
  };
}

function emptyHighLevelData(activeLocationId: string, connectedLocation: string, lastSyncAt: string): HighLevelDataPayload {
  return {
    activeLocationId,
    calendars: [],
    connectedLocation,
    contacts: [],
    conversations: [],
    customFields: [],
    forms: [],
    lastSyncAt,
    locations: [],
    opportunities: [],
    pipelines: [],
    revenueFunnel: buildRevenueFunnel([], []),
    tags: [],
    workflows: [],
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
