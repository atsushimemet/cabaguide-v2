#!/usr/bin/env node
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { parse } from "csv-parse/sync";

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

async function main() {
  console.log("=== Start importing store data ===");

  const areaRows = readCsv("area.csv").map((row, index) => {
    const ctx = { fileName: "area.csv", rowNumber: index + 2 };
    return {
      id: getInt(row, "id", { required: true, ...ctx }),
      todofuken_name: getString(row, "todofuken_name", { required: true, ...ctx }),
      downtown_name: getString(row, "downtown_name", { required: true, ...ctx }),
    };
  });

  const storeRows = readCsv("store.csv").map((row, index) => {
    const ctx = { fileName: "store.csv", rowNumber: index + 2 };
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
      nomination_price: getInt(row, "nomination_price", { required: false, ...ctx }),
      service_fee_rate: getDecimal(row, "service_fee_rate", ctx),
    };
  });

  const timeSlotRows = readCsv("store_time_slot_pricings.csv").map((row, index) => {
    const ctx = { fileName: "store_time_slot_pricings.csv", rowNumber: index + 2 };
    return {
      id: getOptionalString(row, "id", ctx),
      store_id: getString(row, "store_id", { required: true, ...ctx }),
      time_slot: getInt(row, "time_slot", { required: true, ...ctx }),
      main_price: getInt(row, "main_price", { required: true, ...ctx }),
      vip_price: getInt(row, "vip_price", { required: false, ...ctx }),
    };
  });

  await upsertRows("area", areaRows, { onConflict: "id" });
  await upsertRows("stores", storeRows, { onConflict: "id" });
  await upsertRows("store_base_pricings", basePricingRows, { onConflict: "store_id" });
  await upsertRows("store_time_slot_pricings", timeSlotRows, { onConflict: "store_id,time_slot" });

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

function getInt(row, column, { required, fileName, rowNumber }) {
  const raw = getString(row, column, { required, fileName, rowNumber });
  if (raw === "") {
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
  if (raw === "") {
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

main().catch((error) => {
  console.error("インポート処理でエラーが発生しました:", error);
  process.exit(1);
});
