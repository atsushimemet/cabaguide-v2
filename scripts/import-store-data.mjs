#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CHUNK_SIZE = 500;

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が設定されていません。");
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const shouldReset = process.argv.includes("--reset");

async function main() {
  console.log("=== Start importing store data ===");

  if (shouldReset) {
    await resetTables();
  }

  const areaRows = readCsv("area.csv").map((row, index) => {
    const ctx = { fileName: "area.csv", rowNumber: index + 2 };
    return {
      id: getInt(row, "id", { required: true, ...ctx }),
      todofuken_name: getString(row, "todofuken_name", { required: true, ...ctx }),
      downtown_name: getString(row, "downtown_name", { required: true, ...ctx }),
    };
  });

  const storeRows = readCsv("stores.csv").map((row, index) => {
    const ctx = { fileName: "stores.csv", rowNumber: index + 2 };
    return {
      id: getOptionalString(row, "id", ctx),
      area_id: getInt(row, "area_id", { required: true, ...ctx }),
      name: getString(row, "name", { required: true, ...ctx }),
      google_map_link: getString(row, "google_map_link", { required: true, ...ctx }),
      phone: getOptionalString(row, "phone", ctx),
      homepage_link: getOptionalString(row, "homepage_link", ctx),
    };
  });

  const basePricingRows = readCsv("store_base_pricings.csv").map((row, index) => {
    const ctx = { fileName: "store_base_pricings.csv", rowNumber: index + 2 };
    return {
      id: getOptionalString(row, "id", ctx),
      store_id: getString(row, "store_id", { required: true, ...ctx }),
      nomination_price: getInt(row, "nomination_price", { required: false, allowNullLiteral: true, ...ctx }),
      service_fee_rate: getDecimal(row, "service_fee_rate", ctx),
    };
  });

  const timeSlotRows = readCsv("store_time_slot_pricings.csv").map((row, index) => {
    const ctx = { fileName: "store_time_slot_pricings.csv", rowNumber: index + 2 };
    return {
      id: getOptionalString(row, "id", ctx),
      store_id: getString(row, "store_id", { required: true, ...ctx }),
      time_slot_hour: getInt(row, "time_slot_hour", { required: true, ...ctx }),
      time_slot_minute: getInt(row, "time_slot_minute", { required: true, ...ctx }),
      main_price: getInt(row, "main_price", { required: true, ...ctx }),
    };
  });
  const dedupedTimeSlotRows = dedupeTimeSlots(timeSlotRows);

  await upsertRows("area", areaRows, { onConflict: "id" });
  await upsertRows("stores", storeRows, { onConflict: "id" });
  await upsertRows("store_base_pricings", basePricingRows, { onConflict: "store_id" });
  await upsertRows("store_time_slot_pricings", dedupedTimeSlotRows, { onConflict: "store_id,time_slot_hour,time_slot_minute" });

  console.log("=== Import completed successfully ===");
}

function readCsv(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSVファイルが見つかりません: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  if (!content.trim()) {
    return [];
  }

  return parse(content, {
    columns: (header) => header.map((column) => column.trim()),
    skip_empty_lines: true,
    trim: true,
  }).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
    )
  );
}

function getString(row, column, { required, fileName, rowNumber }) {
  const value = row[column];
  const trimmed = typeof value === "string" ? value.trim() : value ?? "";

  if (!trimmed && required) {
    throw new Error(`${fileName} の ${column} が行 ${rowNumber} で空です。`);
  }

  return trimmed || "";
}

function getOptionalString(row, column, ctx) {
  const value = getString(row, column, { required: false, ...ctx });
  return value === "" ? undefined : value;
}

function getInt(row, column, { required, fileName, rowNumber, allowNullLiteral = false }) {
  const raw = getString(row, column, { required, fileName, rowNumber });
  if (raw === "" || (allowNullLiteral && raw.toLowerCase() === "null")) {
    return null;
  }

  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) {
    throw new Error(`${fileName} の ${column} が行 ${rowNumber} で整数として解釈できません: ${raw}`);
  }
  return value;
}

function getDecimal(row, column, ctx) {
  const raw = getString(row, column, { required: false, ...ctx });
  if (raw === "" || raw.toLowerCase() === "null") {
    return null;
  }

  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${ctx.fileName} の ${column} が行 ${ctx.rowNumber} で数値として解釈できません: ${raw}`);
  }

  return value;
}

async function upsertRows(table, rows, { onConflict }) {
  if (!rows.length) {
    console.log(`[skip] ${table}: インポート対象の行がありません。`);
    return;
  }

  console.log(`[upsert] ${table}: ${rows.length} rows`);

  for (let start = 0; start < rows.length; start += CHUNK_SIZE) {
    const chunk = rows.slice(start, start + CHUNK_SIZE);
    const { error } = await client.from(table).upsert(chunk, { onConflict });
    if (error) {
      throw new Error(`${table} への upsert に失敗しました: ${error.message}`);
    }
  }
}

async function resetTables() {
  console.log("Resetting existing data before import...");
  const steps = [
    {
      table: "store_time_slot_pricings",
      filter: (query) => query.not("id", "is", null),
    },
    {
      table: "store_base_pricings",
      filter: (query) => query.not("id", "is", null),
    },
    {
      table: "stores",
      filter: (query) => query.not("id", "is", null),
    },
    {
      table: "area",
      filter: (query) => query.gte("id", 0),
    },
  ];

  for (const step of steps) {
    console.log(`- clearing ${step.table}`);
    let query = client.from(step.table).delete();
    query = step.filter(query);
    const { error } = await query;
    if (error) {
      throw new Error(`${step.table} の削除に失敗しました: ${error.message}`);
    }
  }
}

function dedupeTimeSlots(rows) {
  const map = new Map();
  const duplicates = [];
  for (const row of rows) {
    const key = `${row.store_id}:${row.time_slot_hour}:${row.time_slot_minute}`;
    if (map.has(key)) {
      duplicates.push(key);
    }
    map.set(key, row);
  }
  if (duplicates.length > 0) {
    console.warn(
      `[warn] store_time_slot_pricings: ${duplicates.length} duplicate rows detected (store_id, hour, minute). Last occurrence kept.`
    );
  }
  return Array.from(map.values());
}

main().catch((error) => {
  console.error("インポート処理でエラーが発生しました:", error);
  process.exit(1);
});
