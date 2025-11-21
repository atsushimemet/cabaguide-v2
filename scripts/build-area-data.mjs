import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();
const csvPath = resolve(rootDir, "src/data/area.csv");
const targetTsPath = resolve(rootDir, "src/data/areas.ts");
const targetSqlPath = resolve(rootDir, "supabase/seeds/area.sql");

const csv = readFileSync(csvPath, "utf8").trim();
const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
const [, ...rows] = lines; // skip header

const areas = rows.map((row) => {
  const [id, todofukenName, downtownName] = row.split(",").map((value) => value.trim());
  return {
    id: Number(id),
    todofukenName,
    downtownName,
  };
});

const escapeJs = (value) => value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$").replace(/"/g, '\\"');
const escapeSql = (value) => value.replace(/'/g, "''");

const tsEntries = areas
  .map(
    (area) =>
      `  { id: ${area.id}, todofukenName: "${escapeJs(area.todofukenName)}", downtownName: "${escapeJs(area.downtownName)}" }`
  )
  .join(",\n");

const tsContent = `import { Area } from "@/types/area";

export const areas: Area[] = [
${tsEntries}
];
`;

const valuesSql = areas
  .map(
    (area) =>
      `  (${area.id}, '${escapeSql(area.todofukenName)}', '${escapeSql(area.downtownName)}')`
  )
  .join(",\n");

const seedSql = `insert into public.area (id, todofuken_name, downtown_name) values\n${valuesSql}\non conflict (id) do update set\n  todofuken_name = excluded.todofuken_name,\n  downtown_name = excluded.downtown_name;\n`;

writeFileSync(targetTsPath, tsContent, "utf8");
writeFileSync(targetSqlPath, seedSql, "utf8");

console.log(`Generated ${areas.length} areas.`);
console.log(`- ${targetTsPath}`);
console.log(`- ${targetSqlPath}`);
