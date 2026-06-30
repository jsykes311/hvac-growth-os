import { Pool } from "pg";

type CredentialProvider = "google_ads" | "highlevel";

let pool: Pool | null = null;
let initialized = false;

function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

export function isDatabaseCredentialStoreConfigured() {
  return Boolean(databaseUrl());
}

export function credentialStorageLabel({
  connected,
  fileStoreConfigured,
}: {
  connected: boolean;
  fileStoreConfigured: boolean;
}) {
  if (!connected) return "Not connected";
  if (isDatabaseCredentialStoreConfigured()) return "Database credential store";
  if (fileStoreConfigured) return "Configured token store path";
  return "In-app temporary token store";
}

export async function loadEncryptedCredentialStore(provider: CredentialProvider) {
  if (!isDatabaseCredentialStoreConfigured()) return null;
  await ensureCredentialStoreTable();
  const result = await getPool().query<{ encrypted_payload: string }>(
    "select encrypted_payload from hvac_growth_os_credential_stores where provider = $1 limit 1",
    [provider],
  );
  return result.rows[0]?.encrypted_payload ?? null;
}

export async function saveEncryptedCredentialStore(provider: CredentialProvider, encryptedPayload: string) {
  if (!isDatabaseCredentialStoreConfigured()) return false;
  await ensureCredentialStoreTable();
  await getPool().query(
    `insert into hvac_growth_os_credential_stores (provider, encrypted_payload, updated_at)
     values ($1, $2, now())
     on conflict (provider)
     do update set encrypted_payload = excluded.encrypted_payload, updated_at = now()`,
    [provider, encryptedPayload],
  );
  return true;
}

async function ensureCredentialStoreTable() {
  if (initialized) return;
  await getPool().query(`
    create table if not exists hvac_growth_os_credential_stores (
      provider text primary key,
      encrypted_payload text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  initialized = true;
}

function getPool() {
  if (pool) return pool;
  pool = new Pool({
    connectionString: databaseUrl(),
    ssl: process.env.POSTGRES_DISABLE_SSL === "true" ? undefined : { rejectUnauthorized: false },
  });
  return pool;
}
