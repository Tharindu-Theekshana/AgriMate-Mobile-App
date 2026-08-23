import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const diseases = sqliteTable('diseases', {
  diseaseKey: text('disease_key').primaryKey(),
  json: text('json').notNull(),
  nameEn: text('name_en').notNull(),
});

export const farms = sqliteTable('farms', {
  id: text('id').primaryKey(),
  serverId: integer('server_id'),
  name: text('name').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  sizeAcres: real('size_acres'),
  soilType: text('soil_type'),
  syncState: text('sync_state').notNull().default('synced'),
  updatedAt: integer('updated_at').notNull(),
  deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
});

export const crops = sqliteTable('crops', {
  id: text('id').primaryKey(), 
  serverId: integer('server_id'),
  farmId: text('farm_id').notNull(), 
  serverFarmId: integer('server_farm_id'),
  cropType: text('crop_type').notNull().default('paddy'),
  variety: text('variety'),
  season: text('season'), // MAHA | YALA | null
  areaAcres: real('area_acres'),
  plantingDate: text('planting_date'),
  expectedHarvestDate: text('expected_harvest_date'),
  growingPeriodDays: integer('growing_period_days'),
  growthStage: text('growth_stage'),
  status: text('status').notNull().default('GROWING'), // GROWING | HARVESTED | FAILED
  harvestDate: text('harvest_date'),
  yieldKg: real('yield_kg'),
  qualityGrade: text('quality_grade'),
  sellingPrice: real('selling_price'),
  syncState: text('sync_state').notNull().default('synced'),
  updatedAt: integer('updated_at').notNull(),
  deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
});

export const treatments = sqliteTable('treatments', {
  id: text('id').primaryKey(),
  serverId: integer('server_id'),
  cropId: text('crop_id').notNull(),
  serverCropId: integer('server_crop_id'),
  productName: text('product_name').notNull(),
  type: text('type').notNull().default('FERTILIZER'), // FERTILIZER | PESTICIDE
  quantity: text('quantity'),
  appliedDate: text('applied_date'),
  syncState: text('sync_state').notNull().default('synced'),
  updatedAt: integer('updated_at').notNull(),
  deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
});

export const scans = sqliteTable('scans', {
  serverId: integer('server_id').primaryKey(), // scans are created online
  json: text('json').notNull(),
  predictedDisease: text('predicted_disease').notNull(),
  createdAt: integer('created_at').notNull(),
});

export type SyncState = 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
