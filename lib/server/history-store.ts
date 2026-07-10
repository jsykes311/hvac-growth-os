import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { Pool } from "pg";

const COMFORT_GUARDIANS_CLIENT_ID = "comfort-guardians";

export type HistoryEventType =
  | "website_scan"
  | "google_ads_sync"
  | "highlevel_sync"
  | "google_business_profile_sync"
  | "decision"
  | "deployment"
  | "intelligence_memory";

export type HistoryEvent = {
  id: string;
  clientId: string;
  createdAt: string;
  eventType: HistoryEventType;
  metricDate: string;
  payload: Record<string, unknown>;
  source: string;
  summary: Record<string, unknown>;
};

let pool: Pool | null = null;
let initialized = false;

export function comfortGuardiansHistoryClientId() {
  return COMFORT_GUARDIANS_CLIENT_ID;
}

export async function recordComfortGuardiansHistoryEvent(input: {
  eventType: HistoryEventType;
  metricDate?: string;
  payload: Record<string, unknown>;
  source: string;
  summary: Record<string, unknown>;
}) {
  const event: HistoryEvent = {
    clientId: COMFORT_GUARDIANS_CLIENT_ID,
    createdAt: new Date().toISOString(),
    eventType: input.eventType,
    id: crypto.randomUUID(),
    metricDate: input.metricDate || new Date().toISOString().slice(0, 10),
    payload: input.payload,
    source: input.source,
    summary: input.summary,
  };

  if (databaseUrl()) {
    await ensureHistoryTable();
    await getPool().query(
      `insert into hvac_growth_os_history_events
        (id, client_id, event_type, source, metric_date, summary, payload, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.id,
        event.clientId,
        event.eventType,
        event.source,
        event.metricDate,
        event.summary,
        event.payload,
        event.createdAt,
      ],
    );
    return event;
  }

  const events = await getFileHistory();
  events.unshift(event);
  await mkdir(path.dirname(fileStorePath()), { recursive: true });
  await writeFile(fileStorePath(), JSON.stringify(events.slice(0, 500), null, 2), "utf8");
  return event;
}

export async function getComfortGuardiansHistory(limit = 100) {
  const safeLimit = Math.max(1, Math.min(500, Math.round(limit)));
  if (databaseUrl()) {
    await ensureHistoryTable();
    const result = await getPool().query<{
      id: string;
      client_id: string;
      created_at: Date;
      event_type: HistoryEventType;
      metric_date: string;
      payload: Record<string, unknown>;
      source: string;
      summary: Record<string, unknown>;
    }>(
      `select id, client_id, created_at, event_type, source, metric_date, summary, payload
       from hvac_growth_os_history_events
       where client_id = $1
       order by created_at desc
       limit $2`,
      [COMFORT_GUARDIANS_CLIENT_ID, safeLimit],
    );
    return result.rows.map((row) => ({
      clientId: row.client_id,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      eventType: row.event_type,
      id: row.id,
      metricDate: row.metric_date,
      payload: row.payload,
      source: row.source,
      summary: row.summary,
    })) satisfies HistoryEvent[];
  }

  return (await getFileHistory()).slice(0, safeLimit);
}

export async function getComfortGuardiansHistorySummary() {
  const events = await getComfortGuardiansHistory(250);
  const latestByType = new Map<HistoryEventType, HistoryEvent>();
  events.forEach((event) => {
    if (!latestByType.has(event.eventType)) latestByType.set(event.eventType, event);
  });

  return {
    clientId: COMFORT_GUARDIANS_CLIENT_ID,
    eventCounts: events.reduce<Record<string, number>>((counts, event) => {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
      return counts;
    }, {}),
    latestEvents: Array.from(latestByType.values()),
    totalEvents: events.length,
  };
}

async function getFileHistory() {
  try {
    const raw = await readFile(fileStorePath(), "utf8");
    return JSON.parse(raw) as HistoryEvent[];
  } catch {
    return [];
  }
}

async function ensureHistoryTable() {
  if (initialized) return;
  await getPool().query(`
    create table if not exists hvac_growth_os_history_events (
      id uuid primary key,
      client_id text not null,
      event_type text not null,
      source text not null,
      metric_date date not null,
      summary jsonb not null,
      payload jsonb not null,
      created_at timestamptz not null default now()
    )
  `);
  await getPool().query(`
    create index if not exists hvac_growth_os_history_events_client_created_idx
      on hvac_growth_os_history_events (client_id, created_at desc)
  `);
  await getPool().query(`
    create index if not exists hvac_growth_os_history_events_client_type_date_idx
      on hvac_growth_os_history_events (client_id, event_type, metric_date desc)
  `);
  initialized = true;
}

function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

function fileStorePath() {
  return path.join(os.tmpdir(), "hvac-growth-os-comfort-guardians-history.json");
}

function getPool() {
  if (pool) return pool;
  pool = new Pool({
    connectionString: databaseUrl(),
    ssl: process.env.POSTGRES_DISABLE_SSL === "true" ? undefined : { rejectUnauthorized: false },
  });
  return pool;
}
