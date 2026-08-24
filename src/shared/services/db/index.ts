import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

// Single shared connection (expo-sqlite synchronous API).
const expoDb = SQLite.openDatabaseSync('agrimate.db');
export const db = drizzle(expoDb, { schema });

export function initDb(): void {
  expoDb.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS diseases (
      disease_key TEXT PRIMARY KEY NOT NULL,
      json TEXT NOT NULL,
      name_en TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY NOT NULL,
      server_id INTEGER,
      name TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      size_acres REAL,
      soil_type TEXT,
      sync_state TEXT NOT NULL DEFAULT 'synced',
      updated_at INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS crops (
      id TEXT PRIMARY KEY NOT NULL,
      server_id INTEGER,
      farm_id TEXT NOT NULL,
      server_farm_id INTEGER,
      crop_type TEXT NOT NULL DEFAULT 'paddy',
      variety TEXT,
      season TEXT,
      area_acres REAL,
      planting_date TEXT,
      expected_harvest_date TEXT,
      growing_period_days INTEGER,
      growth_stage TEXT,
      status TEXT NOT NULL DEFAULT 'GROWING',
      harvest_date TEXT,
      yield_kg REAL,
      quality_grade TEXT,
      selling_price REAL,
      sync_state TEXT NOT NULL DEFAULT 'synced',
      updated_at INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS treatments (
      id TEXT PRIMARY KEY NOT NULL,
      server_id INTEGER,
      crop_id TEXT NOT NULL,
      server_crop_id INTEGER,
      product_name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'FERTILIZER',
      quantity TEXT,
      applied_date TEXT,
      sync_state TEXT NOT NULL DEFAULT 'synced',
      updated_at INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS crop_stage_logs (
      id TEXT PRIMARY KEY NOT NULL,
      server_id INTEGER,
      crop_id TEXT NOT NULL,
      server_crop_id INTEGER,
      stage_key TEXT NOT NULL,
      reached_date TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'synced',
      updated_at INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS scans (
      server_id INTEGER PRIMARY KEY NOT NULL,
      json TEXT NOT NULL,
      predicted_disease TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  migrate(`ALTER TABLE farms DROP COLUMN category`);
  migrate(`ALTER TABLE crops ADD COLUMN variety TEXT`);
  migrate(`ALTER TABLE crops ADD COLUMN season TEXT`);
  migrate(`ALTER TABLE crops ADD COLUMN area_acres REAL`);
  migrate(`ALTER TABLE crops ADD COLUMN status TEXT NOT NULL DEFAULT 'GROWING'`);
  migrate(`ALTER TABLE crops ADD COLUMN harvest_date TEXT`);
  migrate(`ALTER TABLE crops ADD COLUMN yield_kg REAL`);
  migrate(`ALTER TABLE crops ADD COLUMN quality_grade TEXT`);
  migrate(`ALTER TABLE crops ADD COLUMN selling_price REAL`);
  migrate(`ALTER TABLE crops ADD COLUMN growing_period_days INTEGER`);
}

function migrate(sql: string): void {
  try {
    expoDb.execSync(sql);
  } catch {
    // coloumn already exist
  }
}

// wibe local data on logot
export function clearLocalData(): void {
  expoDb.execSync(`DELETE FROM farms; DELETE FROM crops; DELETE FROM treatments; DELETE FROM crop_stage_logs; DELETE FROM scans;`);
}
