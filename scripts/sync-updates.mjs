#!/usr/bin/env node
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import process from "process";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が設定されていません。");
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const updatesDir = path.join(process.cwd(), "docs", "updates");

async function main() {
  let files;
  try {
    files = await fs.readdir(updatesDir);
  } catch (error) {
    console.error(`updatesディレクトリ(${updatesDir})が読み込めませんでした。`, error);
    process.exit(1);
  }

  const markdownFiles = files.filter((file) => file.endsWith(".md"));
  if (markdownFiles.length === 0) {
    console.log("同期対象のMarkdownファイルがありません。");
    return;
  }

  for (const fileName of markdownFiles) {
    const filePath = path.join(updatesDir, fileName);
    const slug = fileName.replace(/\.md$/, "");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const { title, body } = extractTitleAndBody(fileContent, slug);

    const { error } = await client
      .from("updates")
      .upsert({ slug, title, body }, { onConflict: "slug" });

    if (error) {
      console.error(`「${fileName}」の同期に失敗しました:`, error.message);
      process.exitCode = 1;
    } else {
      console.log(`Synced: ${fileName}`);
    }
  }
}

function extractTitleAndBody(markdown, slug) {
  const lines = markdown.split(/\r?\n/);
  let title = slugToTitle(slug);
  const bodyLines = [];
  let titleCaptured = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!titleCaptured && trimmed.startsWith("# ")) {
      title = trimmed.replace(/^#\s*/, "").trim() || title;
      titleCaptured = true;
      continue;
    }
    bodyLines.push(line);
  }

  return { title, body: bodyLines.join("\n").trim() };
}

function slugToTitle(slug) {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

main().catch((error) => {
  console.error("同期処理でエラーが発生しました:", error);
  process.exit(1);
});
