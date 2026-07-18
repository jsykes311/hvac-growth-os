import crypto from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import {
  credentialStorageLabel,
  isDatabaseCredentialStoreConfigured,
  loadEncryptedCredentialStore,
  saveEncryptedCredentialStore,
} from "@/lib/server/credential-store";

type PermissionMode = "Read Only" | "Write Enabled" | "Draft Mode" | "Agency Mode" | "Owner Mode";

type HighLevelTokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  locationId: string;
  scope: string;
};

export class HighLevelSyncError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "HighLevelSyncError";
    this.status = status;
  }
}

export type HighLevelRecord = {
  id: string;
  name: string;
  status?: string;
  source?: string;
  stage?: string;
  value?: number;
  createdAt?: string;
  rawText?: string;
  type?: string;
};

export type RevenueFunnelPayload = {
  googleAdsClicks: number;
  googleAdsSpend: number;
  crmLeads: number;
  phoneCalls: number;
  missedCalls: number;
  appointments: number;
  formsSubmitted: number;
  totalConversations: number;
  totalOpportunities: number;
  leads: number;
  estimates: number;
  wonOpportunities: number;
  wonJobs: number;
  openPipelineValue: number;
  closedWonValue: number;
  pipelineValue: number;
  revenue: number;
  estimatedRevenue: number;
  roi: number;
  leadSources: Array<{ source: string; count: number; value: number }>;
  opportunityStages: Array<{ stage: string; count: number; value: number }>;
  stageMapping: Array<{ stage: string; mappedTo: "Lead" | "Appointment" | "Estimate" | "Won" | "Lost" | "Ignore"; count: number; value: number }>;
  campaignAttribution: Array<{
    campaign: string;
    clicks: number;
    calls: number;
    appointments: number;
    estimates: number;
    wonJobs: number;
    revenue: number;
    closeRate: number;
    revenuePerClick: number;
    costPerWonJob: number;
    estimatedRoi: number;
    cost: number;
    leads: number;
    value: number;
  }>;
  sourceIntelligence: Array<{
    channel: "Google Ads" | "Meta" | "Google Business Profile" | "Organic Search" | "Direct" | "Referral" | "Email" | "Unknown";
    confidence: number;
    count: number;
    rawSources: string[];
    recommendation: string;
    value: number;
  }>;
};

export type HighLevelSnapshot = {
  appointments: number;
  closedWon: number;
  contacts: number;
  estimates: number;
  estimatedRevenue: number;
  openOpportunities: number;
  phoneCalls: number;
  missedCalls: number;
  formsSubmitted: number;
  pipelineValue: number;
  syncedAt: string;
  wonJobs: number;
};

export type HighLevelSyncDiagnostic = {
  endpoint: string;
  label: string;
  message: string;
  pages: number;
  records: number;
  status: "OK" | "Empty" | "Error";
};

export type HighLevelDataPayload = {
  activeLocationId: string;
  connectedLocation: string;
  lastSyncAt: string;
  syncRange: {
    endDate: string;
    startDate: string;
  };
  locations: HighLevelRecord[];
  contacts: HighLevelRecord[];
  opportunities: HighLevelRecord[];
  opportunityStages: HighLevelRecord[];
  pipelines: HighLevelRecord[];
  conversations: HighLevelRecord[];
  calls: HighLevelRecord[];
  calendars: HighLevelRecord[];
  forms: HighLevelRecord[];
  formSubmissions: HighLevelRecord[];
  tags: HighLevelRecord[];
  workflows: HighLevelRecord[];
  customFields: HighLevelRecord[];
  revenueFunnel: RevenueFunnelPayload;
  snapshots: HighLevelSnapshot[];
  syncAlerts: string[];
  syncDiagnostics: HighLevelSyncDiagnostic[];
};

type HighLevelStore = {
  activeLocationId: string;
  connectedLocation: string;
  connectionSource: "OAuth" | "API Key" | "";
  lastSyncAt: string;
  permissionMode: PermissionMode;
  setupConfig?: {
    privateIntegrationToken?: string;
    locationId?: string;
    savedAt: string;
  };
  snapshots: HighLevelSnapshot[];
  tokenSet?: HighLevelTokenSet;
  data?: HighLevelDataPayload;
};

type HighLevelDateRange = {
  endDate?: string;
  startDate?: string;
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
    apiKey: process.env.HIGHLEVEL_API_KEY || process.env.HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN || "",
    clientId: process.env.HIGHLEVEL_CLIENT_ID || "",
    clientSecret: process.env.HIGHLEVEL_CLIENT_SECRET || "",
    encryptionKey: process.env.HIGHLEVEL_TOKEN_ENCRYPTION_KEY || process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || process.env.HVAC_GROWTH_OS_AUTH_SECRET || "",
    locationId: process.env.HIGHLEVEL_LOCATION_ID || "",
    writeEnabled: process.env.HIGHLEVEL_WRITE_ENABLED === "true",
    redirectUri: process.env.HIGHLEVEL_REDIRECT_URI || process.env.HIGHLEVEL_OAUTH_REDIRECT_URI || "",
    scopes: process.env.HIGHLEVEL_OAUTH_SCOPES || DEFAULT_SCOPES,
    tokenStorePath: process.env.HIGHLEVEL_TOKEN_STORE_PATH || path.join(os.tmpdir(), "hvac-growth-os-highlevel-store.json"),
  };
}

export function highLevelSetupStatus(store?: HighLevelStore) {
  const config = highLevelConfig();
  const oauthReady = Boolean(config.clientId && config.clientSecret && config.redirectUri);
  const savedApiKey = store?.setupConfig?.privateIntegrationToken || "";
  const savedLocationId = store?.setupConfig?.locationId || store?.activeLocationId || "";
  const apiKeyReady = Boolean((config.apiKey || savedApiKey) && (config.locationId || savedLocationId));
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
      envVar: "HIGHLEVEL_REDIRECT_URI",
      label: "HighLevel OAuth redirect URI",
    },
    {
      configured: Boolean(config.apiKey || savedApiKey) || oauthReady,
      detail: "Fallback read-only connection when OAuth is not available for this location-level account.",
      envVar: "HIGHLEVEL_API_KEY or HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN",
      label: "HighLevel private integration token",
    },
    {
      configured: Boolean(config.locationId || savedLocationId) || oauthReady,
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

export function isHighLevelOAuthConfigured() {
  const config = highLevelConfig();
  return Boolean(config.clientId && config.clientSecret && config.redirectUri && config.encryptionKey);
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
  const setup = highLevelSetupStatus(store);
  const config = highLevelConfig();
  const hasEnvApiKeyFallback = Boolean(config.apiKey && config.locationId);
  const hasSavedApiKeyFallback = Boolean(store.setupConfig?.privateIntegrationToken && (store.setupConfig?.locationId || store.activeLocationId));
  const hasApiKeyFallback = hasEnvApiKeyFallback || hasSavedApiKeyFallback;
  const connected = Boolean(store.tokenSet?.refreshToken || hasApiKeyFallback);
  const data = store.data;
  const fileStoreConfigured = Boolean(process.env.HIGHLEVEL_TOKEN_STORE_PATH);
  return {
    highLevel: {
      activeLocationId: store.activeLocationId || store.setupConfig?.locationId || config.locationId,
      callsTracked: data?.revenueFunnel.phoneCalls ?? 0,
      closedWon: data?.revenueFunnel.wonOpportunities ?? 0,
      closedWonValue: data?.revenueFunnel.closedWonValue ?? 0,
      connected,
      connectedLocation: store.connectedLocation,
      connectionSource: store.tokenSet?.refreshToken ? "OAuth" : hasApiKeyFallback ? "API Key" : "",
      credentialStorage: store.tokenSet?.refreshToken
        ? credentialStorageLabel({ connected: true, fileStoreConfigured })
        : hasEnvApiKeyFallback
          ? "Render environment variables"
          : hasSavedApiKeyFallback
            ? credentialStorageLabel({ connected: true, fileStoreConfigured })
            : "Not connected",
      configured: setup.ready,
      lastSyncAt: store.lastSyncAt,
      leadSources: data?.revenueFunnel.leadSources ?? [],
      formsSubmitted: data?.revenueFunnel.formsSubmitted ?? 0,
      missedCalls: data?.revenueFunnel.missedCalls ?? 0,
      openOpportunities: data ? Math.max(data.opportunities.length - data.revenueFunnel.wonOpportunities, 0) : 0,
      openPipelineValue: data?.revenueFunnel.openPipelineValue ?? 0,
      permissionMode: store.permissionMode,
      pipelineValue: data?.revenueFunnel.pipelineValue ?? 0,
      setup,
      tokenStored: Boolean(store.tokenSet?.refreshToken || hasApiKeyFallback),
      totalContacts: data?.contacts.length ?? 0,
      totalConversations: data?.conversations.length ?? 0,
      totalOpportunities: data?.opportunities.length ?? 0,
    },
  };
}

export async function saveHighLevelPrivateIntegrationConfig({
  locationId,
  privateIntegrationToken,
}: {
  locationId: string;
  privateIntegrationToken: string;
}) {
  const cleanedLocationId = locationId.trim();
  const cleanedToken = privateIntegrationToken.trim();
  if (!cleanedLocationId) throw new HighLevelSyncError("Location ID is required.", 400);
  if (!cleanedToken) throw new HighLevelSyncError("Private integration token is required.", 400);
  if (!highLevelConfig().encryptionKey) throw new HighLevelSyncError("Connector encryption is not available. Set HVAC_GROWTH_OS_AUTH_SECRET or HIGHLEVEL_TOKEN_ENCRYPTION_KEY first.", 500);

  const store = await loadHighLevelStore();
  const nextStore: HighLevelStore = {
    ...store,
    activeLocationId: cleanedLocationId,
    connectionSource: "API Key",
    permissionMode: highLevelConfig().writeEnabled ? "Write Enabled" : "Read Only",
    setupConfig: {
      locationId: cleanedLocationId,
      privateIntegrationToken: cleanedToken,
      savedAt: new Date().toISOString(),
    },
  };
  await saveHighLevelStore(nextStore);
  return getHighLevelConnectionStatus();
}

export async function getStoredHighLevelData() {
  const store = await loadHighLevelStore();
  return store.data ?? emptyHighLevelData(store.activeLocationId, store.connectedLocation, store.lastSyncAt, store.snapshots);
}

export async function syncHighLevelData(range: HighLevelDateRange = {}) {
  const store = await loadHighLevelStore();
  const config = highLevelConfig();
  const apiKey = config.apiKey || store.setupConfig?.privateIntegrationToken || "";
  const configuredLocationId = config.locationId || store.setupConfig?.locationId || "";
  const apiKeyFallbackReady = Boolean(apiKey && configuredLocationId);
  if (!store.tokenSet?.refreshToken && !apiKeyFallbackReady) throw new HighLevelSyncError("Not connected. Connect HighLevel with OAuth or configure the location-level private integration token before syncing data.", 409);
  if (!highLevelSetupStatus(store).ready) throw new HighLevelSyncError("Not connected. HighLevel OAuth or private integration token settings are incomplete.", 409);

  const accessToken = apiKeyFallbackReady && !store.tokenSet?.refreshToken ? apiKey : await getFreshHighLevelAccessToken(store);
  const locationId = store.activeLocationId || store.tokenSet?.locationId || configuredLocationId;
  if (!locationId) throw new Error("HighLevel did not return a connected location. Reconnect and choose a location.");

  const previousSnapshots = store.snapshots || store.data?.snapshots || [];
  const syncRange = normalizeHighLevelDateRange(range);
  const data = await fetchHighLevelData(accessToken, locationId, previousSnapshots, syncRange);
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

async function fetchHighLevelData(
  accessToken: string,
  locationId: string,
  previousSnapshots: HighLevelSnapshot[],
  syncRange: Required<HighLevelDateRange>,
): Promise<HighLevelDataPayload> {
  const dateQuery = highLevelDateQuery(syncRange);
  const diagnostics: HighLevelSyncDiagnostic[] = [];
  const [
    location,
    contactsRead,
    opportunitiesRead,
    pipelines,
    conversationsRead,
    callsRead,
    calendars,
    forms,
    formSubmissionsRead,
    tags,
    workflows,
    customFields,
  ] = await Promise.all([
    highLevelGet(accessToken, `/locations/${locationId}`),
    highLevelGetCollection(accessToken, "Contacts", `/contacts/?locationId=${encodeURIComponent(locationId)}${dateQuery}`, ["contacts"]),
    highLevelGetCollection(accessToken, "Opportunities", `/opportunities/search?location_id=${encodeURIComponent(locationId)}${dateQuery}`, ["opportunities"]),
    highLevelGet(accessToken, `/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`),
    highLevelGetCollection(accessToken, "Conversations", `/conversations/search?locationId=${encodeURIComponent(locationId)}${dateQuery}`, ["conversations"]),
    highLevelGetCollection(accessToken, "Calls", `/conversations/search?locationId=${encodeURIComponent(locationId)}&type=CALL${dateQuery}`, ["conversations", "calls", "messages"]),
    highLevelGet(accessToken, `/calendars/?locationId=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/forms/?locationId=${encodeURIComponent(locationId)}`),
    highLevelGetCollection(accessToken, "Form submissions", `/forms/submissions?locationId=${encodeURIComponent(locationId)}${dateQuery}`, ["submissions", "formSubmissions", "forms"]),
    highLevelGet(accessToken, `/locations/${locationId}/tags`),
    highLevelGet(accessToken, `/workflows/?locationId=${encodeURIComponent(locationId)}`),
    highLevelGet(accessToken, `/locations/${locationId}/customFields`),
  ]);
  diagnostics.push(contactsRead.diagnostic, opportunitiesRead.diagnostic, conversationsRead.diagnostic, callsRead.diagnostic, formSubmissionsRead.diagnostic);

  const contacts = contactsRead.payload;
  const opportunities = opportunitiesRead.payload;
  const conversations = conversationsRead.payload;
  const calls = callsRead.payload;
  const formSubmissions = formSubmissionsRead.payload;

  const locationRecord = normalizeRecords(location, ["location", "locations"])[0] ?? { id: locationId, name: locationId };
  const normalizedContacts = filterRecordsByDateRange(normalizeRecords(contacts, ["contacts"]), syncRange);
  const normalizedOpportunities = filterRecordsByDateRange(normalizeRecords(opportunities, ["opportunities"]), syncRange);
  const normalizedPipelines = normalizeRecords(pipelines, ["pipelines"]);
  const normalizedConversations = filterRecordsByDateRange(normalizeRecords(conversations, ["conversations"]), syncRange);
  const normalizedCallSearchResults = filterRecordsByDateRange(normalizeRecords(calls, ["conversations", "calls", "messages"]).filter(isCallRecord), syncRange);
  const messageCalls = normalizedCallSearchResults.length ? [] : await fetchConversationCallMessages(accessToken, normalizedConversations, syncRange);
  const normalizedCalls = filterRecordsByDateRange(uniqueRecords([...normalizedCallSearchResults, ...messageCalls]), syncRange);
  const normalizedForms = normalizeRecords(forms, ["forms"]);
  const normalizedFormSubmissions = filterRecordsByDateRange(normalizeRecords(formSubmissions, ["submissions", "formSubmissions", "forms"]), syncRange);
  const normalizedOpportunityStages = normalizeOpportunityStages(pipelines);
  const stageNameLookup = new Map(normalizedOpportunityStages.map((stage) => [stage.id, stage.name]));
  const opportunitiesWithStageNames = normalizedOpportunities.map((opportunity) => ({
    ...opportunity,
    stage: stageNameLookup.get(opportunity.stage || "") || opportunity.stage || opportunity.status || "",
  }));
  const syncAlerts = [
    ...(normalizedContacts.length ? [] : ["No contacts returned for this date range. Try a wider range, or confirm the token can read contacts for this location."]),
    ...(opportunitiesWithStageNames.length ? [] : ["No opportunities returned for this date range. If Comfort Guardians uses custom pipelines, confirm opportunities are stored in this location and the token has opportunities read access."]),
    ...(normalizedCalls.length ? [] : [`No call data found. HVAC Growth OS read ${normalizedConversations.length} conversations, but HighLevel did not expose call-type events from conversation search or message history.`]),
    ...(normalizedFormSubmissions.length ? [] : ["No form submission data found. Confirm forms are connected to this location or that form-submission access is available."]),
    ...diagnostics.filter((item) => item.status === "Error").map((item) => `${item.label}: ${item.message}`),
  ];
  const revenueFunnel = buildRevenueFunnel(normalizedContacts, opportunitiesWithStageNames, normalizedCalls, normalizedFormSubmissions, normalizedConversations);
  const lastSyncAt = new Date().toISOString();
  const snapshots = buildSnapshots(previousSnapshots, lastSyncAt, {
    contacts: normalizedContacts,
    formsSubmitted: normalizedFormSubmissions.length,
    opportunities: opportunitiesWithStageNames,
    phoneCalls: normalizedCalls.length,
    missedCalls: countMissedCalls(normalizedCalls),
    revenueFunnel,
  });

  return {
    activeLocationId: locationId,
    calendars: normalizeRecords(calendars, ["calendars"]),
    calls: normalizedCalls,
    connectedLocation: locationRecord.name || locationId,
    contacts: normalizedContacts,
    conversations: normalizedConversations,
    customFields: normalizeRecords(customFields, ["customFields", "custom_fields"]),
    forms: normalizedForms,
    formSubmissions: normalizedFormSubmissions,
    lastSyncAt,
    locations: [locationRecord],
    opportunities: opportunitiesWithStageNames,
    opportunityStages: normalizedOpportunityStages,
    pipelines: normalizedPipelines,
    revenueFunnel,
    snapshots,
    syncRange,
    syncAlerts,
    syncDiagnostics: [
      ...diagnostics,
      diagnosticFromPayload("Pipelines", `/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`, pipelines, ["pipelines"]),
      diagnosticFromPayload("Calendars", `/calendars/?locationId=${encodeURIComponent(locationId)}`, calendars, ["calendars"]),
      diagnosticFromPayload("Forms", `/forms/?locationId=${encodeURIComponent(locationId)}`, forms, ["forms"]),
      diagnosticFromPayload("Tags", `/locations/${locationId}/tags`, tags, ["tags"]),
      diagnosticFromPayload("Workflows", `/workflows/?locationId=${encodeURIComponent(locationId)}`, workflows, ["workflows"]),
      diagnosticFromPayload("Custom fields", `/locations/${locationId}/customFields`, customFields, ["customFields", "custom_fields"]),
    ],
    tags: normalizeRecords(tags, ["tags"]),
    workflows: normalizeRecords(workflows, ["workflows"]),
  };
}

async function fetchConversationCallMessages(accessToken: string, conversations: HighLevelRecord[], syncRange: Required<HighLevelDateRange>) {
  const limitedConversations = conversations.slice(0, 50);
  const messagePayloads = await Promise.all(limitedConversations.map((conversation) => (
    highLevelGet(accessToken, `/conversations/${encodeURIComponent(conversation.id)}/messages${highLevelDateQuery(syncRange, "?")}`)
  )));
  return uniqueRecords(messagePayloads.flatMap((payload, index) => (
    normalizeRecords(payload, ["messages", "conversationMessages", "data"])
      .filter(isCallRecord)
      .map((message) => ({
        ...message,
        source: message.source || "HighLevel conversation message",
        stage: message.stage || limitedConversations[index]?.name || "",
      }))
  )));
}

function normalizeHighLevelDateRange(range: HighLevelDateRange): Required<HighLevelDateRange> {
  const today = new Date();
  const end = parseDateInput(range.endDate) ?? today;
  const start = parseDateInput(range.startDate) ?? addDays(end, -30);
  return {
    endDate: toDateInput(end),
    startDate: toDateInput(start),
  };
}

function highLevelDateQuery(range: Required<HighLevelDateRange>, prefix = "&") {
  const start = new Date(`${range.startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${range.endDate}T23:59:59.999Z`).getTime();
  return `${prefix}startDate=${start}&endDate=${end}&dateStart=${range.startDate}&dateEnd=${range.endDate}`;
}

function filterRecordsByDateRange(records: HighLevelRecord[], range: Required<HighLevelDateRange>) {
  const start = new Date(`${range.startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${range.endDate}T23:59:59.999Z`).getTime();
  return records.filter((record) => {
    if (!record.createdAt) return true;
    const timestamp = Date.parse(record.createdAt);
    if (Number.isNaN(timestamp)) return true;
    return timestamp >= start && timestamp <= end;
  });
}

function parseDateInput(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function highLevelGet(accessToken: string, endpoint: string) {
  try {
    const response = await fetch(`${HIGHLEVEL_BASE_URL}${endpoint}`, {
      headers: highLevelHeaders(accessToken),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("HighLevel read failed", endpoint, payload);
      if (response.status === 401) throw new HighLevelSyncError("Token expired. Reconnect HighLevel or refresh the private integration token.", 401);
      if (response.status === 403) throw new HighLevelSyncError("Missing location access. The connected HighLevel user or token cannot read this Comfort Guardians location.", 403);
      if (response.status === 404 && endpoint.startsWith("/locations/")) throw new HighLevelSyncError("Missing location access. The configured HighLevel location ID was not found for this token.", 404);
      if (response.status === 429) throw new HighLevelSyncError("API rate limited. HighLevel asked HVAC Growth OS to slow down. Wait a few minutes, then refresh data again.", 429);
      return { __highLevelError: humanReadableHighLevelPayload(payload) || `HighLevel returned ${response.status}.`, __highLevelStatus: response.status };
    }
    return payload;
  } catch (error) {
    if (error instanceof HighLevelSyncError) throw error;
    console.error("HighLevel read failed", endpoint, error);
    return { __highLevelError: "HighLevel could not be reached for this data set.", __highLevelStatus: 0 };
  }
}

async function highLevelGetCollection(accessToken: string, label: string, endpoint: string, keys: string[]) {
  const records: any[] = [];
  const seen = new Set<string>();
  let pages = 0;
  let errorMessage = "";
  const limit = 100;
  const maxPages = 12;

  for (let page = 1; page <= maxPages; page += 1) {
    const pagedEndpoint = withPagination(endpoint, page, limit);
    const payload = await highLevelGet(accessToken, pagedEndpoint);
    pages += 1;

    if (payload?.__highLevelError) {
      errorMessage = String(payload.__highLevelError);
      break;
    }

    const pageRecords = firstArray(payload, keys);
    const newRecords = pageRecords.filter((item: any) => {
      const key = String(item?.id || item?._id || item?.messageId || item?.conversationId || `${item?.name || item?.fullName || ""}-${item?.createdAt || item?.dateAdded || ""}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    records.push(...newRecords);

    if (!pageRecords.length || pageRecords.length < limit || !collectionMayHaveMore(payload, page, limit, records.length)) break;
  }

  return {
    diagnostic: {
      endpoint,
      label,
      message: errorMessage || (records.length ? `Read ${records.length} record${records.length === 1 ? "" : "s"} across ${pages} page${pages === 1 ? "" : "s"}.` : "No records returned for this date range."),
      pages,
      records: records.length,
      status: errorMessage ? "Error" as const : records.length ? "OK" as const : "Empty" as const,
    },
    payload: { [keys[0]]: records },
  };
}

function withPagination(endpoint: string, page: number, limit: number) {
  const [pathPart, queryPart = ""] = endpoint.split("?");
  const params = new URLSearchParams(queryPart);
  if (!params.has("limit")) params.set("limit", String(limit));
  if (!params.has("page")) params.set("page", String(page));
  return `${pathPart}?${params.toString()}`;
}

function collectionMayHaveMore(payload: any, page: number, limit: number, recordsRead: number) {
  const total = Number(payload?.meta?.total ?? payload?.total ?? payload?.count ?? payload?.totalCount ?? 0);
  if (total > 0) return recordsRead < total;
  const nextPage = payload?.meta?.nextPage || payload?.nextPage || payload?.nextPageUrl;
  if (nextPage) return true;
  return page === 1 && recordsRead >= limit;
}

function diagnosticFromPayload(label: string, endpoint: string, payload: any, keys: string[]): HighLevelSyncDiagnostic {
  if (payload?.__highLevelError) {
    return {
      endpoint,
      label,
      message: String(payload.__highLevelError),
      pages: 1,
      records: 0,
      status: "Error",
    };
  }
  const records = firstArray(payload, keys).length;
  return {
    endpoint,
    label,
    message: records ? `Read ${records} record${records === 1 ? "" : "s"}.` : "No records returned.",
    pages: 1,
    records,
    status: records ? "OK" : "Empty",
  };
}

function humanReadableHighLevelPayload(payload: any) {
  if (!payload || typeof payload !== "object") return "";
  return String(payload.message || payload.error || payload.error_description || payload.msg || "");
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
  if (!response.ok || !payload.access_token) throw new HighLevelSyncError("Token expired. Reconnect HighLevel to refresh location-level access.", 401);

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
  const callSignalText = highLevelSignalText(item);
  const direction = firstValue(item.direction, item.callDirection, item.call_direction, item.messageDirection, item.message_direction);
  const callStatus = firstValue(
    item.callStatus,
    item.call_status,
    item.callResult,
    item.call_result,
    item.callOutcome,
    item.call_outcome,
    item.disposition,
    item.result,
    item.outcome,
  );
  const messageStatus = firstValue(item.messageStatus, item.message_status, item.deliveryStatus, item.delivery_status);
  const type = firstValue(item.type, item.messageType, item.message_type, item.eventType, item.event_type, item.communicationType, item.communication_type, callStatus, direction);
  const name = item.name || item.fullName || item.title || item.body || item.subject || [firstName, lastName].filter(Boolean).join(" ") || item.email || item.phone || item.id || item._id || "Unnamed";
  return {
    createdAt: item.createdAt || item.dateAdded || item.created_at || item.updatedAt || "",
    id: String(item.id || item._id || item.messageId || item.conversationId || item.locationId || item.pipelineId || item.name || crypto.randomUUID()),
    name: String(name),
    source: item.source || item.contactSource || item.attributionSource || item.campaignName || item.campaign || "",
    stage: item.pipelineStageId || item.stageId || item.status || item.stage || item.pipelineStageName || "",
    rawText: callSignalText,
    status: firstValue(item.status, callStatus, messageStatus, item.type, item.eventType, item.event_type),
    type: String(type),
    value: Number(item.monetaryValue ?? item.value ?? item.pipelineValue ?? item.opportunityValue ?? 0),
  };
}

function isCallRecord(record: HighLevelRecord) {
  return /call|phone|voicemail|missed|inbound|outbound|type_phone/i.test(`${record.type} ${record.status} ${record.name} ${record.source} ${record.rawText}`);
}

function uniqueRecords(records: HighLevelRecord[]) {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = record.id || `${record.name}-${record.createdAt}-${record.status}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildRevenueFunnel(
  contacts: HighLevelRecord[],
  opportunities: HighLevelRecord[],
  calls: HighLevelRecord[],
  formSubmissions: HighLevelRecord[],
  conversations: HighLevelRecord[],
): RevenueFunnelPayload {
  const stageMapping = groupRecords(opportunities, "stage").slice(0, 20).map((row) => ({
    count: row.count,
    mappedTo: classifyOpportunityStage(row.label),
    stage: row.label,
    value: row.value,
  }));
  const appointments = opportunities.filter((item) => classifyOpportunityStage(`${item.stage} ${item.status} ${item.name}`) === "Appointment");
  const estimates = opportunities.filter((item) => classifyOpportunityStage(`${item.stage} ${item.status} ${item.name}`) === "Estimate");
  const won = opportunities.filter((item) => classifyOpportunityStage(`${item.stage} ${item.status} ${item.name}`) === "Won");
  const openOpportunities = opportunities.filter((item) => !/won|closed won|lost|abandoned|sold/i.test(`${item.stage} ${item.status}`));
  const revenue = sum(won.map((item) => item.value || 0));
  const pipelineValue = sum(opportunities.map((item) => item.value || 0));
  const openPipelineValue = sum(openOpportunities.map((item) => item.value || 0));
  const estimatedRevenue = revenue || sum([...won, ...estimates].map((item) => item.value || 0));
  const googleAdsSpend = 0;
  const missedCalls = countMissedCalls(calls);
  const sourceIntelligence = buildSourceIntelligence([...contacts, ...calls, ...opportunities, ...formSubmissions]);

  return {
    appointments: appointments.length,
    closedWonValue: revenue,
    campaignAttribution: buildCampaignAttribution(contacts, calls, opportunities),
    crmLeads: contacts.length,
    estimates: estimates.length,
    estimatedRevenue,
    formsSubmitted: formSubmissions.length,
    googleAdsClicks: 0,
    googleAdsSpend,
    leadSources: groupRecords([...contacts, ...opportunities], "source").slice(0, 8).map((row) => ({ source: row.label, count: row.count, value: row.value })),
    leads: contacts.length,
    missedCalls,
    openPipelineValue,
    opportunityStages: groupRecords(opportunities, "stage").slice(0, 10).map((row) => ({ stage: row.label, count: row.count, value: row.value })),
    phoneCalls: calls.length,
    pipelineValue,
    revenue,
    roi: googleAdsSpend ? Number((revenue / googleAdsSpend).toFixed(2)) : 0,
    sourceIntelligence,
    totalConversations: conversations.length,
    totalOpportunities: opportunities.length,
    wonJobs: won.length,
    wonOpportunities: won.length,
    stageMapping,
  };
}

function classifyOpportunityStage(value: string): RevenueFunnelPayload["stageMapping"][number]["mappedTo"] {
  const text = value.toLowerCase();
  if (/lost|dead|declined|cancel|abandon|disqualified|no show/.test(text)) return "Lost";
  if (/won|closed won|sold|complete|paid|job won/.test(text)) return "Won";
  if (/estimate|proposal|quote|quoted|bid|sent|approved estimate/.test(text)) return "Estimate";
  if (/appointment|booked|scheduled|dispatch|visit|consult|inspection|set/.test(text)) return "Appointment";
  if (/ignore|spam|duplicate|test/.test(text)) return "Ignore";
  return "Lead";
}

function buildCampaignAttribution(
  contacts: HighLevelRecord[],
  calls: HighLevelRecord[],
  opportunities: HighLevelRecord[],
): RevenueFunnelPayload["campaignAttribution"] {
  const labels = new Set<string>();
  [...contacts, ...calls, ...opportunities].forEach((record) => labels.add((record.source || "Unattributed").trim() || "Unattributed"));
  return [...labels].map((label) => {
    const campaignContacts = contacts.filter((record) => sourceMatches(record, label));
    const campaignCalls = calls.filter((record) => sourceMatches(record, label));
    const campaignOpportunities = opportunities.filter((record) => sourceMatches(record, label));
    const appointments = campaignOpportunities.filter((record) => classifyOpportunityStage(`${record.stage} ${record.status} ${record.name}`) === "Appointment").length;
    const estimates = campaignOpportunities.filter((record) => classifyOpportunityStage(`${record.stage} ${record.status} ${record.name}`) === "Estimate").length;
    const won = campaignOpportunities.filter((record) => classifyOpportunityStage(`${record.stage} ${record.status} ${record.name}`) === "Won");
    const revenue = sum(won.map((record) => record.value || 0));
    const leads = campaignContacts.length;
    const wonJobs = won.length;
    return {
      appointments,
      calls: campaignCalls.length,
      campaign: label,
      clicks: 0,
      closeRate: leads ? Number(((wonJobs / leads) * 100).toFixed(1)) : 0,
      cost: 0,
      costPerWonJob: 0,
      estimatedRoi: 0,
      estimates,
      leads,
      revenue,
      revenuePerClick: 0,
      value: revenue || sum(campaignOpportunities.map((record) => record.value || 0)),
      wonJobs,
    };
  }).sort((a, b) => b.revenue - a.revenue || b.value - a.value || b.leads - a.leads).slice(0, 12);
}

function sourceMatches(record: HighLevelRecord, source: string) {
  return ((record.source || "Unattributed").trim() || "Unattributed") === source;
}

function buildSourceIntelligence(records: HighLevelRecord[]): RevenueFunnelPayload["sourceIntelligence"] {
  const grouped = new Map<RevenueFunnelPayload["sourceIntelligence"][number]["channel"], {
    count: number;
    rawSources: Set<string>;
    value: number;
  }>();

  for (const record of records) {
    const rawSource = sourceFingerprint(record);
    const channel = classifySourceChannel(rawSource);
    const current = grouped.get(channel) || { count: 0, rawSources: new Set<string>(), value: 0 };
    current.count += 1;
    current.value += record.value || 0;
    if (rawSource) current.rawSources.add(rawSource);
    grouped.set(channel, current);
  }

  return Array.from(grouped.entries()).map(([channel, row]) => ({
    channel,
    confidence: sourceConfidence(channel, row.rawSources),
    count: row.count,
    rawSources: Array.from(row.rawSources).slice(0, 8),
    recommendation: sourceRecommendation(channel, row.count, row.value),
    value: row.value,
  })).sort((a, b) => b.value - a.value || b.count - a.count);
}

function sourceFingerprint(record: HighLevelRecord) {
  return [
    record.source,
    record.name,
    record.status,
    record.stage,
    record.type,
  ].filter(Boolean).join(" ").trim();
}

function classifySourceChannel(value: string): RevenueFunnelPayload["sourceIntelligence"][number]["channel"] {
  const text = value.toLowerCase();
  if (/gclid|gbraid|wbraid|google ads|adwords|paid search|ppc|cpc|google paid/.test(text)) return "Google Ads";
  if (/facebook|fbclid|instagram|meta|ig|paid social/.test(text)) return "Meta";
  if (/gbp|gmb|google business|google maps|maps|business profile/.test(text)) return "Google Business Profile";
  if (/organic|seo|google search|bing|search/.test(text)) return "Organic Search";
  if (/email|newsletter|mailchimp|constant contact/.test(text)) return "Email";
  if (/referral|partner|yelp|angi|homeadvisor|nextdoor/.test(text)) return "Referral";
  if (/direct|website|web|manual|phone|call|type_phone/.test(text)) return "Direct";
  return "Unknown";
}

function sourceConfidence(channel: RevenueFunnelPayload["sourceIntelligence"][number]["channel"], rawSources: Set<string>) {
  if (channel === "Unknown") return 35;
  if (!rawSources.size) return 45;
  return Math.min(92, 60 + rawSources.size * 6);
}

function sourceRecommendation(channel: RevenueFunnelPayload["sourceIntelligence"][number]["channel"], count: number, value: number) {
  if (channel === "Google Ads") return value > 0 ? "Review Google Ads sourced opportunities before shifting budget." : "Confirm Google Ads leads are creating opportunities and values in HighLevel.";
  if (channel === "Meta") return "Use Meta-sourced CRM activity to guide social offers and retargeting ideas.";
  if (channel === "Google Business Profile") return "Watch GBP calls and leads before prioritizing review requests or profile posts.";
  if (channel === "Organic Search") return "Use organic CRM leads to prioritize SEO pages and city/service content.";
  if (channel === "Direct") return "Improve direct-call attribution with UTM, call source, and intake fields.";
  if (channel === "Unknown") return count ? "Clean up source fields so HVAC Growth OS can attribute revenue more confidently." : "No source data found yet.";
  return "Review this source for lead quality and follow-up opportunities.";
}

function countMissedCalls(calls: HighLevelRecord[]) {
  return calls.filter(isMissedCallRecord).length;
}

function isMissedCallRecord(item: HighLevelRecord) {
  const text = `${item.type} ${item.status} ${item.name} ${item.source} ${item.rawText}`.toLowerCase();
  if (/missed|no[\s_-]?answer|unanswered|not[\s_-]?answered|did[\s_-]?not[\s_-]?answer|abandoned|voicemail|voice[\s_-]?mail|busy|failed/.test(text)) return true;

  const inbound = /\binbound\b|incoming|call_inbound|inbound_call|direction[\s":_-]+inbound|type_phone/.test(text);
  const answeredFalse = /answered[\s":_-]+false|isanswered[\s":_-]+false|callanswered[\s":_-]+false|answeredby[\s":_-]+none/.test(text);
  const completedFalse = /completed[\s":_-]+false|connected[\s":_-]+false/.test(text);
  const zeroDuration = /duration[\s":_-]+0|callduration[\s":_-]+0|call_duration[\s":_-]+0|talktime[\s":_-]+0|talk_time[\s":_-]+0/.test(text);
  return inbound && (answeredFalse || completedFalse || zeroDuration);
}

function firstValue(...values: unknown[]) {
  const value = values.find((item) => item !== undefined && item !== null && String(item).trim() !== "");
  return value === undefined ? "" : String(value);
}

function highLevelSignalText(item: any, depth = 0): string {
  if (!item || depth > 3) return "";
  if (typeof item !== "object") return String(item);

  const parts: string[] = [];
  for (const [key, value] of Object.entries(item)) {
    const normalizedKey = key.toLowerCase();
    const signalKey = /call|phone|status|direction|answer|answered|duration|talk|voicemail|voice|result|outcome|disposition|recording|type|message/.test(normalizedKey);
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      const stringValue = String(value);
      if (signalKey || /missed|no answer|unanswered|voicemail|inbound|outbound|type_phone|answered|busy|failed/i.test(stringValue)) {
        parts.push(`${normalizedKey}:${stringValue}`);
      }
    } else if (signalKey || depth < 2) {
      const nested = highLevelSignalText(value, depth + 1);
      if (nested) parts.push(`${normalizedKey}:{${nested}}`);
    }
  }
  return parts.join(" ");
}

function buildSnapshots(
  previousSnapshots: HighLevelSnapshot[],
  syncedAt: string,
  data: {
    contacts: HighLevelRecord[];
    formsSubmitted: number;
    opportunities: HighLevelRecord[];
    phoneCalls: number;
    missedCalls: number;
    revenueFunnel: RevenueFunnelPayload;
  },
) {
  const snapshot: HighLevelSnapshot = {
    appointments: data.revenueFunnel.appointments,
    closedWon: data.revenueFunnel.wonOpportunities,
    contacts: data.contacts.length,
    estimates: data.revenueFunnel.estimates,
    estimatedRevenue: data.revenueFunnel.estimatedRevenue,
    formsSubmitted: data.formsSubmitted,
    missedCalls: data.missedCalls,
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
  if (isDatabaseCredentialStoreConfigured()) {
    const encrypted = await loadEncryptedCredentialStore("highlevel");
    if (encrypted) return { ...defaultStore(), ...JSON.parse(decrypt(encrypted)) };
  }

  try {
    const raw = await readFile(config.tokenStorePath, "utf8");
    const parsed = JSON.parse(raw) as { encrypted?: string };
    if (!parsed.encrypted) return defaultStore();
    if (isDatabaseCredentialStoreConfigured()) {
      await saveEncryptedCredentialStore("highlevel", parsed.encrypted);
    }
    return { ...defaultStore(), ...JSON.parse(decrypt(parsed.encrypted)) };
  } catch {
    return defaultStore();
  }
}

async function saveHighLevelStore(store: HighLevelStore) {
  const config = highLevelConfig();
  if (!config.encryptionKey) throw new Error("HIGHLEVEL_TOKEN_ENCRYPTION_KEY is required before storing HighLevel OAuth tokens.");
  const encrypted = encrypt(JSON.stringify(store));
  if (await saveEncryptedCredentialStore("highlevel", encrypted)) return;
  await mkdir(path.dirname(config.tokenStorePath), { recursive: true });
  await writeFile(config.tokenStorePath, JSON.stringify({ encrypted }, null, 2), "utf8");
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
    permissionMode: highLevelConfig().writeEnabled ? "Write Enabled" : "Read Only",
    snapshots: [],
  };
}

function emptyHighLevelData(activeLocationId: string, connectedLocation: string, lastSyncAt: string, snapshots: HighLevelSnapshot[] = []): HighLevelDataPayload {
  const syncRange = normalizeHighLevelDateRange({});
  return {
    activeLocationId,
    calendars: [],
    calls: [],
    connectedLocation,
    contacts: [],
    conversations: [],
    customFields: [],
    forms: [],
    formSubmissions: [],
    lastSyncAt,
    locations: [],
    opportunities: [],
    opportunityStages: [],
    pipelines: [],
    revenueFunnel: buildRevenueFunnel([], [], [], [], []),
    snapshots,
    syncRange,
    syncAlerts: [],
    syncDiagnostics: [],
    tags: [],
    workflows: [],
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
