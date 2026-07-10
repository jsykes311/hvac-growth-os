export type UserRole = "Admin" | "TallTwin Team" | "Client" | "Viewer";

export type ApprovedUser = {
  clientIds?: string[];
  email: string;
  name: string;
  password?: string;
  passwordHash?: string;
  role: UserRole;
};

export type AuthSession = {
  clientIds: string[];
  email: string;
  exp: number;
  name: string;
  role: UserRole;
};

const SESSION_COOKIE = "hvac_growth_os_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export function sessionCookieName() {
  return SESSION_COOKIE;
}

export function sessionMaxAgeSeconds() {
  return SESSION_MAX_AGE_SECONDS;
}

export async function authenticateApprovedUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getApprovedUserByEmail(normalizedEmail);
  if (!user) return null;

  const expectedHash = user.passwordHash || (user.password ? await sha256(user.password) : "");
  const receivedHash = await sha256(password);
  if (!expectedHash || expectedHash !== receivedHash) return null;

  return user;
}

export function getApprovedUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return approvedUsers().find((item) => item.email.toLowerCase() === normalizedEmail) ?? null;
}

export async function createSessionToken(user: ApprovedUser) {
  const session: AuthSession = {
    clientIds: user.clientIds ?? [],
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    name: user.name,
    role: user.role,
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = await sign(payload).catch(() => "");
  if (signature !== expectedSignature) return null;

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as AuthSession;
    if (!session.email || !session.role || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function approvedUsersConfigured() {
  return approvedUsers().length > 0;
}

function approvedUsers(): ApprovedUser[] {
  const raw = process.env.HVAC_GROWTH_OS_USERS || "";
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ApprovedUser[];
    return Array.isArray(parsed)
      ? parsed.filter((user) => user.email && user.name && user.role)
      : [];
  } catch {
    return [];
  }
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    textBytes(authSecret()),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textBytes(payload));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function authSecret() {
  const configuredSecret = process.env.HVAC_GROWTH_OS_AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("HVAC_GROWTH_OS_AUTH_SECRET is required in production.");
  }
  return "local-dev-hvac-growth-os-secret";
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", textBytes(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function textBytes(value: string) {
  return new TextEncoder().encode(value);
}

function base64UrlEncode(value: string) {
  return base64UrlEncodeBytes(textBytes(value));
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
