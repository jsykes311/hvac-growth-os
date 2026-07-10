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

type PermissionMode = "Read Only" | "Draft Mode" | "Agency Mode" | "Owner Mode";

type GoogleBusinessProfileTokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
};

type GoogleBusinessProfileStore = {
  activeAccountId: string;
  activeLocationId: string;
  accountIds: string[];
  lastSyncAt: string;
  locationIds: string[];
  permissionMode: PermissionMode;
  snapshots: GoogleBusinessProfileSnapshot[];
  tokenSet?: GoogleBusinessProfileTokenSet;
  data?: GoogleBusinessProfileDataPayload;
};

export type GoogleBusinessProfileRecord = {
  accountId?: string;
  id: string;
  name: string;
  status?: string;
  detail?: string;
  createdAt?: string;
  rating?: number;
};

export type GoogleBusinessProfileSnapshot = {
  accounts: number;
  averageRating: number;
  locations: number;
  posts: number;
  reviews: number;
  syncedAt: string;
};

export type GoogleBusinessProfileDataPayload = {
  activeAccountId: string;
  activeLocationId: string;
  accounts: GoogleBusinessProfileRecord[];
  averageRating: number;
  lastSyncAt: string;
  locations: GoogleBusinessProfileRecord[];
  posts: GoogleBusinessProfileRecord[];
  reviews: GoogleBusinessProfileRecord[];
  snapshots: GoogleBusinessProfileSnapshot[];
  syncAlerts: string[];
};

const GOOGLE_BUSINESS_PROFILE_SCOPE = "https://www.googleapis.com/auth/business.manage";

export function googleBusinessProfileConfig() {
  const defaultTokenStorePath = path.join(os.tmpdir(), "hvac-growth-os-google-business-profile-store.json");
  return {
    clientId: process.env.GBP_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.GBP_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    encryptionKey: process.env.GBP_TOKEN_ENCRYPTION_KEY || process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || process.env.HVAC_GROWTH_OS_AUTH_SECRET || "",
    redirectUri: process.env.GBP_GOOGLE_OAUTH_REDIRECT_URI || process.env.GOOGLE_BUSINESS_PROFILE_REDIRECT_URI || "",
    tokenStorePath: process.env.GBP_TOKEN_STORE_PATH || defaultTokenStorePath,
    tokenStoreIsTemporary: !process.env.GBP_TOKEN_STORE_PATH,
  };
}

export function googleBusinessProfileSetupStatus() {
  const config = googleBusinessProfileConfig();
  const items = [
    {
      configured: Boolean(config.clientId),
      detail: "Required to send users to Google OAuth consent for Business Profile access.",
      envVar: "GBP_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID",
      label: "Google OAuth client ID",
    },
    {
      configured: Boolean(config.clientSecret),
      detail: "Required to exchange the authorization code for tokens.",
      envVar: "GBP_GOOGLE_CLIENT_SECRET or GOOGLE_CLIENT_SECRET",
      label: "Google OAuth client secret",
    },
    {
      configured: true,
      detail: "Optional. If omitted, HVAC Growth OS uses the current app URL plus /api/google-business-profile/callback. That URI must still be authorized in Google Cloud.",
      envVar: "GBP_GOOGLE_OAUTH_REDIRECT_URI",
      label: "GBP OAuth redirect URI",
    },
    {
      configured: Boolean(config.encryptionKey),
      detail: "Required to encrypt the stored refresh token.",
      envVar: "GBP_TOKEN_ENCRYPTION_KEY or GOOGLE_TOKEN_ENCRYPTION_KEY",
      label: "Token encryption key",
    },
  ];

  return {
    items,
    missingItems: items.filter((item) => !item.configured).map((item) => item.envVar),
    ready: items.every((item) => item.configured),
  };
}

export function buildGoogleBusinessProfileOAuthUrl({ origin, state }: { origin: string; state: string }) {
  const config = googleBusinessProfileConfig();
  const redirectUri = config.redirectUri || `${origin}/api/google-business-profile/callback`;
  const params = new URLSearchParams({
    access_type: "offline",
    client_id: config.clientId,
    include_granted_scopes: "true",
    prompt: "consent",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_BUSINESS_PROFILE_SCOPE,
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleBusinessProfileCode({ code, origin }: { code: string; origin: string }) {
  const config = googleBusinessProfileConfig();
  const redirectUri = config.redirectUri || `${origin}/api/google-business-profile/callback`;
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
    throw new Error(payload.error || "Google Business Profile OAuth token exchange failed.");
  }

  const existing = await loadGoogleBusinessProfileStore();
  const tokenSet: GoogleBusinessProfileTokenSet = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || existing.tokenSet?.refreshToken || "",
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    scope: payload.scope || GOOGLE_BUSINESS_PROFILE_SCOPE,
  };

  if (!tokenSet.refreshToken) {
    throw new Error("Google did not return a refresh token. Reconnect with consent enabled.");
  }

  const nextStore = {
    ...existing,
    permissionMode: "Read Only" as PermissionMode,
    tokenSet,
  };
  await saveGoogleBusinessProfileStore(nextStore);
  return nextStore;
}

export async function getGoogleBusinessProfileConnectionStatus() {
  const store = await loadGoogleBusinessProfileStore();
  const setup = googleBusinessProfileSetupStatus();
  const config = googleBusinessProfileConfig();
  const connected = Boolean(store.tokenSet?.refreshToken);
  const data = store.data;
  return {
    googleBusinessProfile: {
      activeAccountId: store.activeAccountId,
      activeLocationId: store.activeLocationId,
      accountIds: store.accountIds,
      averageRating: data?.averageRating ?? 0,
      connected,
      configured: setup.ready,
      credentialStorage: credentialStorageLabel({
        connected,
        fileStoreConfigured: !config.tokenStoreIsTemporary,
      }),
      lastSyncAt: store.lastSyncAt,
      locationIds: store.locationIds,
      permissionMode: store.permissionMode,
      posts: data?.posts.length ?? 0,
      reviews: data?.reviews.length ?? 0,
      setup,
      tokenStored: Boolean(store.tokenSet?.refreshToken),
    },
  };
}

export async function setActiveGoogleBusinessProfileLocation({ accountId, locationId }: { accountId: string; locationId: string }) {
  const store = await loadGoogleBusinessProfileStore();
  const cleanedAccountId = cleanResourceId(accountId);
  const cleanedLocationId = cleanResourceId(locationId);
  if (!cleanedAccountId || !cleanedLocationId) throw new Error("Choose a valid Google Business Profile account and location.");
  if (!store.accountIds.includes(cleanedAccountId)) store.accountIds = [cleanedAccountId, ...store.accountIds];
  if (!store.locationIds.includes(cleanedLocationId)) store.locationIds = [cleanedLocationId, ...store.locationIds];
  store.activeAccountId = cleanedAccountId;
  store.activeLocationId = cleanedLocationId;
  await saveGoogleBusinessProfileStore(store);
  return store;
}

export async function getStoredGoogleBusinessProfileData() {
  const store = await loadGoogleBusinessProfileStore();
  return store.data ?? emptyGoogleBusinessProfileData(store.activeAccountId, store.activeLocationId, store.lastSyncAt, store.snapshots);
}

export async function syncGoogleBusinessProfileData() {
  const store = await loadGoogleBusinessProfileStore();
  if (!store.tokenSet?.refreshToken) throw new Error("Connect Google Business Profile before syncing data.");
  if (!googleBusinessProfileSetupStatus().ready) throw new Error("Google Business Profile OAuth client, redirect URI, and token encryption settings are required.");

  const accessToken = await getFreshAccessToken(store);
  const previousSnapshots = store.snapshots || store.data?.snapshots || [];
  const data = await fetchGoogleBusinessProfileData(accessToken, store.activeAccountId, store.activeLocationId, previousSnapshots);
  const nextStore: GoogleBusinessProfileStore = {
    ...store,
    activeAccountId: data.activeAccountId,
    activeLocationId: data.activeLocationId,
    accountIds: data.accounts.map((account) => account.id),
    data,
    lastSyncAt: data.lastSyncAt,
    locationIds: data.locations.map((location) => location.id),
    snapshots: data.snapshots,
  };
  await saveGoogleBusinessProfileStore(nextStore);
  return data;
}

async function fetchGoogleBusinessProfileData(
  accessToken: string,
  preferredAccountId: string,
  preferredLocationId: string,
  previousSnapshots: GoogleBusinessProfileSnapshot[],
): Promise<GoogleBusinessProfileDataPayload> {
  const syncAlerts: string[] = [];
  const accountsPayload = await googleBusinessProfileGet(accessToken, "https://mybusinessaccountmanagement.googleapis.com/v1/accounts", syncAlerts);
  const accounts = normalizeAccounts(accountsPayload);
  const locationPayloads = await Promise.all(accounts.map(async (account) => ({
    accountId: account.id,
    payload: await googleBusinessProfileGet(accessToken, `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${account.id}/locations?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri,regularHours,profile,categories,metadata`, syncAlerts),
  })));
  const locations = locationPayloads.flatMap((item) => normalizeLocations(item.payload, item.accountId));
  const selectedLocation = locations.find((location) => location.id === preferredLocationId)
    || locations.find((location) => location.name.toLowerCase().includes("comfort guardians"))
    || locations[0];
  const activeAccountId = selectedLocation?.accountId || preferredAccountId || accounts[0]?.id || "";
  const activeLocationId = selectedLocation?.id || preferredLocationId || "";
  const legacyAccount = activeAccountId ? `accounts/${activeAccountId}` : "";
  const legacyLocation = activeLocationId ? `locations/${activeLocationId}` : "";
  const reviewsPayload = legacyAccount && legacyLocation
    ? await googleBusinessProfileGet(accessToken, `https://mybusiness.googleapis.com/v4/${legacyAccount}/${legacyLocation}/reviews`, syncAlerts)
    : {};
  const postsPayload = legacyAccount && legacyLocation
    ? await googleBusinessProfileGet(accessToken, `https://mybusiness.googleapis.com/v4/${legacyAccount}/${legacyLocation}/localPosts`, syncAlerts)
    : {};
  const reviews = normalizeReviews(reviewsPayload);
  const posts = normalizePosts(postsPayload);
  const lastSyncAt = new Date().toISOString();
  const averageRating = reviews.length ? reviews.reduce((total, review) => total + (review.rating || 0), 0) / reviews.length : 0;
  const payload = {
    activeAccountId,
    activeLocationId,
    accounts,
    averageRating,
    lastSyncAt,
    locations,
    posts,
    reviews,
    snapshots: [],
    syncAlerts: [
      ...syncAlerts,
      ...(accounts.length ? [] : ["No Google Business Profile accounts were returned for this Google user. Confirm the user has access to the Comfort Guardians profile."]),
      ...(locations.length ? [] : ["No Google Business Profile locations were returned. Confirm Business Profile API access and profile permissions."]),
    ],
  };

  return {
    ...payload,
    snapshots: buildSnapshots(previousSnapshots, payload, lastSyncAt),
  };
}

async function googleBusinessProfileGet(accessToken: string, url: string, syncAlerts: string[]) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error?.message === "string" ? payload.error.message : "Google Business Profile endpoint was not available.";
    syncAlerts.push(message);
    return {};
  }
  return payload;
}

async function getFreshAccessToken(store: GoogleBusinessProfileStore) {
  if (store.tokenSet && store.tokenSet.expiresAt > Date.now() + 60_000) {
    return store.tokenSet.accessToken;
  }

  const config = googleBusinessProfileConfig();
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
  if (!response.ok || !payload.access_token) throw new Error(payload.error || "Unable to refresh Google Business Profile access token.");

  store.tokenSet = {
    accessToken: payload.access_token,
    refreshToken: store.tokenSet?.refreshToken || "",
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    scope: payload.scope || store.tokenSet?.scope || GOOGLE_BUSINESS_PROFILE_SCOPE,
  };
  await saveGoogleBusinessProfileStore(store);
  return payload.access_token;
}

async function loadGoogleBusinessProfileStore(): Promise<GoogleBusinessProfileStore> {
  const config = googleBusinessProfileConfig();
  if (isDatabaseCredentialStoreConfigured()) {
    const encrypted = await loadEncryptedCredentialStore("google_business_profile");
    if (encrypted) return { ...defaultStore(), ...JSON.parse(decrypt(encrypted)) };
  }

  try {
    const raw = await readFile(config.tokenStorePath, "utf8");
    const parsed = JSON.parse(raw) as { encrypted?: string };
    if (!parsed.encrypted) return defaultStore();
    if (isDatabaseCredentialStoreConfigured()) {
      await saveEncryptedCredentialStore("google_business_profile", parsed.encrypted);
    }
    return { ...defaultStore(), ...JSON.parse(decrypt(parsed.encrypted)) };
  } catch {
    return defaultStore();
  }
}

async function saveGoogleBusinessProfileStore(store: GoogleBusinessProfileStore) {
  const config = googleBusinessProfileConfig();
  if (!config.encryptionKey) throw new Error("GBP_TOKEN_ENCRYPTION_KEY or GOOGLE_TOKEN_ENCRYPTION_KEY is required before storing Google Business Profile OAuth tokens.");
  const encrypted = encrypt(JSON.stringify(store));
  if (await saveEncryptedCredentialStore("google_business_profile", encrypted)) return;
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
  const configured = googleBusinessProfileConfig().encryptionKey;
  if (!configured) throw new Error("GBP_TOKEN_ENCRYPTION_KEY or GOOGLE_TOKEN_ENCRYPTION_KEY is required.");
  return crypto.createHash("sha256").update(configured).digest();
}

function defaultStore(): GoogleBusinessProfileStore {
  return {
    activeAccountId: "",
    activeLocationId: "",
    accountIds: [],
    lastSyncAt: "",
    locationIds: [],
    permissionMode: "Read Only",
    snapshots: [],
  };
}

function emptyGoogleBusinessProfileData(
  activeAccountId: string,
  activeLocationId: string,
  lastSyncAt: string,
  snapshots: GoogleBusinessProfileSnapshot[] = [],
): GoogleBusinessProfileDataPayload {
  return {
    activeAccountId,
    activeLocationId,
    accounts: [],
    averageRating: 0,
    lastSyncAt,
    locations: [],
    posts: [],
    reviews: [],
    snapshots,
    syncAlerts: [],
  };
}

function buildSnapshots(
  previousSnapshots: GoogleBusinessProfileSnapshot[],
  data: Omit<GoogleBusinessProfileDataPayload, "snapshots"> & { snapshots: GoogleBusinessProfileSnapshot[] },
  syncedAt: string,
) {
  const snapshot = {
    accounts: data.accounts.length,
    averageRating: data.averageRating,
    locations: data.locations.length,
    posts: data.posts.length,
    reviews: data.reviews.length,
    syncedAt,
  };
  return [snapshot, ...previousSnapshots.filter((item) => item.syncedAt !== syncedAt)].slice(0, 24);
}

function normalizeAccounts(payload: any): GoogleBusinessProfileRecord[] {
  return firstArray(payload, ["accounts"]).map((account: any) => {
    const name = String(account.accountName || account.name || "Google Business Profile account");
    return {
      detail: account.type || "",
      id: cleanResourceId(account.name || account.accountId || name),
      name,
      status: account.verificationState || account.permissionLevel || "",
    };
  });
}

function normalizeLocations(payload: any, accountId: string): GoogleBusinessProfileRecord[] {
  return firstArray(payload, ["locations"]).map((location: any) => {
    const title = String(location.title || location.locationName || location.name || "Business Profile location");
    const phone = location.phoneNumbers?.primaryPhone || "";
    const address = location.storefrontAddress?.addressLines?.join(", ") || "";
    return {
      accountId,
      detail: [phone, address, location.websiteUri].filter(Boolean).join(" | "),
      id: cleanResourceId(location.name || location.locationId || title),
      name: title,
      status: location.metadata?.hasGoogleUpdated || location.metadata?.canDelete ? "Needs review" : "Synced",
    };
  });
}

function normalizeReviews(payload: any): GoogleBusinessProfileRecord[] {
  return firstArray(payload, ["reviews"]).map((review: any) => ({
    createdAt: review.createTime || review.updateTime || "",
    detail: review.comment || review.reviewReply?.comment || "",
    id: cleanResourceId(review.name || review.reviewId || crypto.randomUUID()),
    name: review.reviewer?.displayName || "Customer review",
    rating: starRatingValue(review.starRating),
    status: review.reviewReply ? "Replied" : "Needs reply review",
  }));
}

function normalizePosts(payload: any): GoogleBusinessProfileRecord[] {
  return firstArray(payload, ["localPosts"]).map((post: any) => ({
    createdAt: post.createTime || post.updateTime || "",
    detail: post.summary || post.topicType || "",
    id: cleanResourceId(post.name || crypto.randomUUID()),
    name: post.summary ? String(post.summary).slice(0, 80) : "Google Business Profile post",
    status: post.state || post.searchUrl || "Synced",
  }));
}

function firstArray(payload: any, keys: string[]) {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload)) return payload;
  return [];
}

function cleanResourceId(value: string) {
  const trimmed = String(value || "").trim();
  return trimmed.split("/").pop()?.replace(/[^0-9A-Za-z_-]/g, "") || "";
}

function starRatingValue(value: unknown) {
  const text = String(value || "").toUpperCase();
  const lookup: Record<string, number> = {
    FIVE: 5,
    FOUR: 4,
    ONE: 1,
    STAR_RATING_UNSPECIFIED: 0,
    THREE: 3,
    TWO: 2,
  };
  return lookup[text] ?? Number(value ?? 0) ?? 0;
}
