// Loads the autocomplete lists produced by scripts/build-tags.mjs.
const FILES = { art: "art-tags.json", function: "function-tags.json" };
const cache = {};

// Resolves to [] if the file is missing, so the form still works without tag data.
export const loadTags = (kind) =>
  (cache[kind] ??= fetch(`${import.meta.env.BASE_URL}tags/${FILES[kind]}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((rows) => rows.map(([slug, label, count]) => ({ slug, label, count })))
    .catch(() => []));

// Prefix matches first, then word-prefix matches, then substring matches; popular tags first within each.
export function searchTags(tags, text, limit = 8) {
  const q = text.trim().toLowerCase();
  const slugQ = q.replace(/\s+/g, "-");
  if (!q) return [];
  const hits = [];
  for (const t of tags) {
    const label = t.label.toLowerCase();
    let score;
    if (t.slug.startsWith(slugQ)) score = 0;
    else if (t.slug.split("-").some((w) => w.startsWith(slugQ)) || label.split(/\s+/).some((w) => w.startsWith(q))) score = 1;
    else if (t.slug.includes(slugQ) || label.includes(q)) score = 2;
    else continue;
    hits.push([score, t]);
  }
  hits.sort((a, b) => a[0] - b[0] || b[1].count - a[1].count);
  return hits.slice(0, limit).map(([, t]) => ({ label: t.label, value: t.slug }));
}

// Random pick that skips very obscure tags when there are plenty to choose from.
export function randomTag(tags) {
  if (!tags.length) return null;
  const common = tags.filter((t) => t.count >= 5);
  const pool = common.length ? common : tags;
  const t = pool[Math.floor(Math.random() * pool.length)];
  return { label: t.label, value: t.slug };
}
