import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { Pool } from "pg";
import type { AnalyzedPage, BusinessProfile } from "@/lib/types";
import { recordComfortGuardiansHistoryEvent } from "@/lib/server/history-store";

export type SavedClientWorkspace = {
  clientId: string;
  profile: BusinessProfile;
  scrapedPages: AnalyzedPage[];
  updatedAt: string;
  websiteUrl: string;
};

const COMFORT_GUARDIANS_CLIENT_ID = "comfort-guardians";
const COMFORT_GUARDIANS_URL = "https://comfortguardianshvac.com";

let pool: Pool | null = null;
let initialized = false;

export function comfortGuardiansClientId() {
  return COMFORT_GUARDIANS_CLIENT_ID;
}

export function comfortGuardiansUrl() {
  return COMFORT_GUARDIANS_URL;
}

export async function getComfortGuardiansWorkspace() {
  return getClientWorkspace(COMFORT_GUARDIANS_CLIENT_ID);
}

export async function saveComfortGuardiansWorkspace(input: {
  profile: BusinessProfile;
  scrapedPages: AnalyzedPage[];
  websiteUrl?: string;
}) {
  return saveClientWorkspace({
    clientId: COMFORT_GUARDIANS_CLIENT_ID,
    profile: input.profile,
    scrapedPages: input.scrapedPages,
    websiteUrl: input.websiteUrl || COMFORT_GUARDIANS_URL,
  });
}

export function isComfortGuardiansUrl(value: string) {
  try {
    const hostname = new URL(value.startsWith("http") ? value : `https://${value}`).hostname.replace(/^www\./, "");
    return hostname === "comfortguardianshvac.com";
  } catch {
    return value.toLowerCase().includes("comfortguardianshvac.com");
  }
}

async function getClientWorkspace(clientId: string): Promise<SavedClientWorkspace | null> {
  if (databaseUrl()) {
    await ensureClientWorkspaceTable();
    const result = await getPool().query<{ payload: SavedClientWorkspace }>(
      "select payload from hvac_growth_os_client_workspaces where client_id = $1 limit 1",
      [clientId],
    );
    return result.rows[0]?.payload ?? null;
  }

  try {
    const raw = await readFile(fileStorePath(clientId), "utf8");
    return JSON.parse(raw) as SavedClientWorkspace;
  } catch {
    return null;
  }
}

async function saveClientWorkspace(input: {
  clientId: string;
  profile: BusinessProfile;
  scrapedPages: AnalyzedPage[];
  websiteUrl: string;
}) {
  const workspace: SavedClientWorkspace = {
    clientId: input.clientId,
    profile: input.profile,
    scrapedPages: input.scrapedPages,
    updatedAt: new Date().toISOString(),
    websiteUrl: input.websiteUrl,
  };

  if (databaseUrl()) {
    await ensureClientWorkspaceTable();
    await getPool().query(
      `insert into hvac_growth_os_client_workspaces (client_id, payload, updated_at)
       values ($1, $2, now())
       on conflict (client_id)
       do update set payload = excluded.payload, updated_at = now()`,
      [input.clientId, workspace],
    );
    await recordWorkspaceScan(workspace);
    return workspace;
  }

  await mkdir(path.dirname(fileStorePath(input.clientId)), { recursive: true });
  await writeFile(fileStorePath(input.clientId), JSON.stringify(workspace, null, 2), "utf8");
  await recordWorkspaceScan(workspace);
  return workspace;
}

async function recordWorkspaceScan(workspace: SavedClientWorkspace) {
  await recordComfortGuardiansHistoryEvent({
    eventType: "website_scan",
    payload: {
      profile: workspace.profile,
      scrapedPages: workspace.scrapedPages,
      websiteUrl: workspace.websiteUrl,
    },
    source: "Website Scan",
    summary: {
      aiVisibilityScore: workspace.profile.aiSeoAnalysis?.score ?? 0,
      companyName: workspace.profile.companyName,
      growthScore: workspace.profile.growthScore,
      pageCount: workspace.scrapedPages.length,
      phone: workspace.profile.phone,
      serviceAreaCount: workspace.profile.serviceAreas.length,
      serviceCount: workspace.profile.services.length,
      seoScore: workspace.profile.seoAnalysis?.score ?? 0,
      websiteUrl: workspace.websiteUrl,
    },
  });
}

async function ensureClientWorkspaceTable() {
  if (initialized) return;
  await getPool().query(`
    create table if not exists hvac_growth_os_client_workspaces (
      client_id text primary key,
      payload jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  initialized = true;
}

function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

function fileStorePath(clientId: string) {
  return path.join(os.tmpdir(), `hvac-growth-os-${clientId}-workspace.json`);
}

function getPool() {
  if (pool) return pool;
  pool = new Pool({
    connectionString: databaseUrl(),
    ssl: process.env.POSTGRES_DISABLE_SSL === "true" ? undefined : { rejectUnauthorized: false },
  });
  return pool;
}
