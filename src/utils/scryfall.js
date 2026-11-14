const API = "https://api.scryfall.com";
const cache = {};
const cardCache = new Map();

export const seedCards = (cards) =>
  cards.forEach((c) => cardCache.set(c.id, c));

async function getJson(url) {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.details || "Scryfall request failed");
    err.status = res.status;
    throw err;
  }
  return json;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const catalog = (name) =>
  (cache[name] ??= getJson(`${API}/catalog/${name}`).then((j) => j.data));

export const allSets = () =>
  (cache.sets ??= getJson(`${API}/sets`).then((j) => j.data));

// Fetches every page (up to `max` cards) so client-side sorting sees the full set.
// unique: "cards" (one result per card) or "prints" (every printing / art variant)
export async function searchAll(
  query,
  order,
  onProgress,
  max = 1000,
  unique = "cards",
  dir = "asc",
) {
  let url = `${API}/cards/search?q=${encodeURIComponent(query)}&order=${order}&dir=${dir}&unique=${unique}`;
  const cards = [];
  try {
    while (url && cards.length < max) {
      const page = await getJson(url);
      cards.push(...page.data);
      onProgress?.(cards.length, page.total_cards);
      url = page.has_more ? page.next_page : null;
      if (url) await wait(100); // be polite to Scryfall
    }
  } catch (err) {
    if (err.status === 404) return []; // Scryfall uses 404 for "no matches"
    throw err;
  }
  seedCards(cards);
  return cards;
}

export function randomCard(query) {
  const q = query ? `?q=${encodeURIComponent(query)}` : "";
  return getJson(`${API}/cards/random${q}`).then((card) => {
    seedCards([card]);
    return card;
  });
}

// Search results already contain full card objects, so the detail page is usually instant.
export async function getCard(id) {
  if (cardCache.has(id)) return cardCache.get(id);
  const card = await getJson(`${API}/cards/${id}`);
  seedCards([card]);
  return card;
}

// Several cards at once: one POST to /cards/collection per 75 ids, falling back to single GETs.
// Results come back in the order the ids were given; ids that can't be found are skipped.
export async function getCardsById(ids) {
  const found = new Map();
  const missing = [];
  for (const id of ids) {
    if (cardCache.has(id)) found.set(id, cardCache.get(id));
    else missing.push(id);
  }
  for (let i = 0; i < missing.length; i += 75) {
    const chunk = missing.slice(i, i + 75);
    try {
      const res = await fetch(`${API}/cards/collection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ identifiers: chunk.map((id) => ({ id })) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      seedCards(data);
      data.forEach((c) => found.set(c.id, c));
    } catch {
      for (const id of chunk) {
        try {
          found.set(id, await getCard(id));
        } catch {}
        await wait(100);
      }
    }
  }
  return ids.map((id) => found.get(id)).filter(Boolean);
}

export const getRulings = (id) =>
  getJson(`${API}/cards/${id}/rulings`).then((j) => j.data);
