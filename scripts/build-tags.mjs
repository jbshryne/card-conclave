// Builds small autocomplete lists from Scryfall's Art Tags / Oracle Tags bulk files.
//
//   node scripts/build-tags.mjs        (or: npm run tags)
//
// Output (committed, served as static files):
//   public/tags/art-tags.json       [[slug, label, count], ...]  -> art: search field
//   public/tags/function-tags.json  [[slug, label, count], ...]  -> function: search field
//   public/tags/meta.json           { art_tags: {updated_at}, oracle_tags: {updated_at} }
//
// The raw bulk files carry every tagging (every card/illustration per tag), so they
// are far too big to ship to browsers. This script keeps only what autocomplete needs.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";

const API = "https://api.scryfall.com";
// Scryfall requires User-Agent + Accept headers. Put real contact info in the User-Agent.
const HEADERS = {
  "User-Agent": "CardConclave/1.0 (contact: you@example.com)",
  Accept: "application/json;q=0.9,*/*;q=0.8",
};
const OUT = "public/tags";
const KINDS = [
  { type: "art_tags", file: "art-tags.json" },
  { type: "oracle_tags", file: "function-tags.json" },
];
// Scryfall recommends being able to switch individual tags off. Add slugs here to omit them.
const BLOCKLIST = new Set([]);

// Handles a JSON array, JSON Lines, or either of those gzipped.
export function parseBulk(input) {
  let buf = Buffer.from(input);
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = gunzipSync(buf);
  const text = buf.toString("utf8").trim();
  if (text.startsWith("[")) return JSON.parse(text);
  return text.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
}

// Reduces tag objects to {slug, label, count}. Parent tags have no direct taggings of
// their own, so their count includes everything beneath them in the hierarchy.
export function summarize(tags) {
  const byId = new Map(tags.map((t) => [t.id, t]));
  const memo = new Map();
  const total = (tag) => {
    if (memo.has(tag.id)) return memo.get(tag.id);
    memo.set(tag.id, 0); // guards against cycles in the hierarchy
    let n = tag.taggings?.length ?? 0;
    for (const childId of tag.child_ids ?? []) {
      const child = byId.get(childId);
      if (child) n += total(child);
    }
    memo.set(tag.id, n);
    return n;
  };
  return tags
    .filter((t) => t.slug && !BLOCKLIST.has(t.slug))
    .map((t) => ({ slug: t.slug, label: t.label || t.slug, count: total(t) }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

// Newer bulk entries use jsonl_download_uri; older ones used download_uri.
export function pickDownloadUri(entry) {
  const direct = entry.jsonl_download_uri || entry.download_uri;
  if (direct) return direct;
  const key = Object.keys(entry).find((k) => /download/i.test(k) && /^https?:/.test(String(entry[k])));
  if (key) return entry[key];
  throw new Error(`No download link on bulk entry. Fields present: ${JSON.stringify(entry, null, 2)}`);
}

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const metaPath = `${OUT}/meta.json`;
  const meta = existsSync(metaPath) ? JSON.parse(await readFile(metaPath, "utf8")) : {};
  const { data: files } = await getJson(`${API}/bulk-data`);

  for (const { type, file } of KINDS) {
    const entry = files.find((f) => f.type === type);
    if (!entry) {
      throw new Error(`No "${type}" bulk file found. Available: ${files.map((f) => f.type).join(", ")}`);
    }
    if (meta[type]?.updated_at === entry.updated_at && existsSync(`${OUT}/${file}`)) {
      console.log(`${type}: unchanged (${entry.updated_at})`);
      continue;
    }
    const url = pickDownloadUri(entry);
    console.log(`${type}: downloading ${url}`);
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    const rows = summarize(parseBulk(await res.arrayBuffer()));
    await writeFile(`${OUT}/${file}`, JSON.stringify(rows.map((r) => [r.slug, r.label, r.count])));
    meta[type] = { updated_at: entry.updated_at };
    console.log(`${type}: wrote ${rows.length} tags`);
  }
  await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
