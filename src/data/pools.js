// Pools for the "Random" pickers. Scryfall provides catalogs for most of these;
// the rest are hand-maintained here. Edit freely.
import { catalog, allSets } from "../utils/scryfall";

const opts = (pairs) => pairs.map(([value, label]) => ({ value, label }));

export const SUPERTYPES = ["Basic", "Legendary", "Snow", "World", "Ongoing"];
export const MAIN_TYPES = ["Artifact", "Battle", "Creature", "Enchantment", "Instant", "Kindred", "Land", "Planeswalker", "Sorcery"];

const TYPE_CATALOGS = {
  creatureTypes: "creature-types",
  artifactTypes: "artifact-types",
  enchantmentTypes: "enchantment-types",
  spellTypes: "spell-types",
  planeswalkerTypes: "planeswalker-types",
  landTypes: "land-types",
};

export const TYPE_OPTIONS = opts([
  ["supertypes", "Supertype"], ["mainCardTypes", "Main Card Type"], ["creatureTypes", "Creature Type"],
  ["artifactTypes", "Artifact Type"], ["enchantmentTypes", "Enchantment Type"], ["spellTypes", "Spell Type"],
  ["planeswalkerTypes", "Planeswalker Type"], ["battleTypes", "Battle Type"], ["landTypes", "Land Type"],
  ["any", "Any Type"],
]);
export const RULES_OPTIONS = opts([
  ["keyword-abilities", "Keyword Ability"], ["keyword-actions", "Keyword Action"],
  ["ability-words", "Ability Words"], ["flavor-words", "Flavor Words"], ["any", "Any Rules Text"],
]);
export const SET_OPTIONS = opts([
  ["core", "Core Set"], ["expansion", "Expansion"], ["supplemental", "Supplemental"],
  ["nonDCI", "Non-DCI Legal"], ["digital", "Digital Only"], ["extras", "Extras"], ["any", "Any Set"],
]);
export const WATERMARK_OPTIONS = opts([
  ["faction", "Faction"], ["cardInfo", "Card Info"], ["promo", "Promo"], ["crossover", "Crossover"], ["any", "Any Watermark"],
]);

// Starter lists: expand as you discover more watermarks/tags.
const WATERMARKS = {
  faction: ["abzan", "azorius", "boros", "dimir", "golgari", "gruul", "izzet", "jeskai", "mardu", "orzhov", "rakdos", "selesnya", "simic", "sultai", "temur", "silverquill", "prismari", "witherbloom", "lorehold", "quandrix"],
  cardInfo: ["desparked", "planeswalker", "colorless"],
  promo: ["planeswalker"],
  crossover: ["universesbeyond"],
};
export const ART_TAGS = ["calamity-beast", "squirrel-horde", "dragon", "angel", "goblin-horde"];
export const FUNCTION_TAGS = ["lifegain-matters", "cycle-m15-sliver", "ramp", "removal", "draw"];

const flat = async (names) => (await Promise.all(names.map(catalog))).flat();

export const allTypes = async () => [
  ...SUPERTYPES,
  ...MAIN_TYPES,
  ...(await flat(Object.values(TYPE_CATALOGS))),
];

export async function typePool(key) {
  if (key === "supertypes") return SUPERTYPES;
  if (key === "mainCardTypes") return MAIN_TYPES;
  if (key === "battleTypes") return ["Siege"];
  if (key === "any") return allTypes();
  return catalog(TYPE_CATALOGS[key]);
}

export async function rulesPool(key) {
  if (key === "any") return flat(RULES_OPTIONS.slice(0, 4).map((o) => o.value));
  return catalog(key);
}

const SET_TYPES = {
  core: ["core"],
  expansion: ["expansion"],
  supplemental: ["masters", "commander", "draft_innovation", "duel_deck", "from_the_vault", "spellbook", "premium_deck", "starter"],
  nonDCI: ["funny"],
  extras: ["token", "memorabilia", "promo", "minigame", "vanguard", "planechase", "archenemy"],
};
export const setItem = (s) => ({ label: `${s.name} (${s.code.toUpperCase()})`, value: s.code });

export async function setPool(key) {
  const sets = await allSets();
  const match =
    key === "any" ? sets
    : key === "digital" ? sets.filter((s) => s.digital)
    : sets.filter((s) => SET_TYPES[key]?.includes(s.set_type));
  return match.map(setItem);
}

export const watermarkPool = (key) =>
  key === "any" ? Object.values(WATERMARKS).flat() : WATERMARKS[key] ?? [];
