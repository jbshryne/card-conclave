import { useEffect, useMemo, useState } from "react";
import ListField from "./ListField.jsx";
import { allSets, catalog } from "../utils/scryfall";
import { loadTags, searchTags, randomTag } from "../utils/tags";
import { LIST_KEYS, parseNegation } from "../utils/searchParams";
import { SORTS } from "../data/sorts";
import { searchNames, randomName, randomWord, NAME_RANDOM_OPTIONS } from "../utils/names";
import {
  TYPE_OPTIONS, RULES_OPTIONS, SET_OPTIONS,
  ART_TAGS, FUNCTION_TAGS, typePool, rulesPool, setPool,
  allTypes, setItem,
} from "../data/pools";

const COLORS = [["w", "White"], ["u", "Blue"], ["b", "Black"], ["r", "Red"], ["g", "Green"]];
const COLOR_OPS = [["and", "Exactly"], ["or", "Including"], ["not", "Excluding"], ["id", "Identity (EDH)"]];
const RARITIES = [["c", "Common"], ["u", "Uncommon"], ["r", "Rare"], ["m", "Mythic Rare"]];

const emptyPending = () => Object.fromEntries(LIST_KEYS.map((k) => [k, ""]));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const asItem = (v) => (typeof v === "string" ? { label: v, value: v } : v);
const toggle = (set, v) => {
  const next = new Set(set);
  next.has(v) ? next.delete(v) : next.add(v);
  return next;
};

export default function SearchForm({ initial, onSearch, onRandomCard, onDraft, onReset }) {
  const [lists, setLists] = useState(initial.lists);
  const [colors, setColors] = useState(initial.colors);
  const [colorless, setColorless] = useState(initial.colorless);
  const [colorOp, setColorOp] = useState(initial.colorOp);
  const [rarities, setRarities] = useState(initial.rarities);
  const [options, setOptions] = useState(initial.options);
  const [sort, setSort] = useState(initial.sort);
  const [dir, setDir] = useState(initial.dir);
  const [pending, setPending] = useState(emptyPending); // text typed in a box but not yet added as a chip
  const [typeNames, setTypeNames] = useState([]);
  const [sets, setSets] = useState([]);
  const [cardNames, setCardNames] = useState([]);
  const [artistNames, setArtistNames] = useState([]);
  const [watermarks, setWatermarks] = useState([]);
  const [artTags, setArtTags] = useState([]);
  const [functionTags, setFunctionTags] = useState([]);

  // Load suggestion sources once (Scryfall responses are cached in scryfall.js)
  useEffect(() => {
    allTypes().then(setTypeNames).catch(() => {});
    allSets().then(setSets).catch(() => {});
    catalog("card-names").then(setCardNames).catch(() => {});
    catalog("artist-names").then(setArtistNames).catch(() => {});
    catalog("watermarks").then(setWatermarks).catch(() => {});
    loadTags("art").then(setArtTags);
    loadTags("function").then(setFunctionTags);
  }, []);

  // Turns typed text (or a picked suggestion) into a chip item
  const makeItem = (field, value) => {
    let item = asItem(value);
    if (typeof value === "string") {
      const { value: text, negate } = parseNegation(value); // "-elf" adds NOT elf
      item = { label: text, value: text, negate };
      if (field === "art" || field === "function") {
        // Tag searches use hyphenated slugs, e.g. "squirrel horde" -> squirrel-horde
        item.value = item.label = text.trim().toLowerCase().replace(/\s+/g, "-");
      }
    }
    if (field === "set") {
      // Resolve typed set names/codes to a code Scryfall understands
      const q = item.value.toLowerCase();
      const found = sets.find((s) => s.code === q || s.name.toLowerCase() === q);
      if (found) Object.assign(item, setItem(found));
    }
    return item;
  };
  const has = (items, item) => items.some((i) => i.value === item.value && !!i.negate === !!item.negate);

  const add = (field, value) => {
    const item = makeItem(field, value);
    setLists((l) => (has(l[field], item) ? l : { ...l, [field]: [...l[field], item] }));
  };

  // Anything typed in a box counts as part of the search, chip or not
  const listsWithPending = () => {
    const merged = { ...lists };
    for (const field of LIST_KEYS) {
      const typed = pending[field].trim();
      if (!typed) continue;
      const item = makeItem(field, typed);
      if (!has(merged[field], item)) merged[field] = [...merged[field], item];
    }
    return merged;
  };
  const remove = (field, index) =>
    setLists((l) => ({ ...l, [field]: l[field].filter((_, i) => i !== index) }));

  const toggleNegate = (field, index) =>
    setLists((l) => ({
      ...l,
      [field]: l[field].map((item, i) => (i === index ? { ...item, negate: !item.negate } : item)),
    }));

  const suggestTypes = useMemo(() => {
    const unique = [...new Set(typeNames)];
    return (text) =>
      unique.filter((t) => t.toLowerCase().includes(text.toLowerCase())).map((t) => ({ label: t, value: t }));
  }, [typeNames]);
  const suggestSets = (text) =>
    sets
      .filter((s) => s.name.toLowerCase().includes(text.toLowerCase()) || s.code === text.toLowerCase())
      .map(setItem);

  const state = { lists, colors, colorless, colorOp, rarities, options, sort, dir };

  // Keep a draft so the form is still filled in when you come back from the results page
  useEffect(() => {
    onDraft?.(state);
  }, [lists, colors, colorless, colorOp, rarities, options, sort, dir]);

  // Fold typed-but-unadded text into the chips, remember it for Back, then search
  const searchWith = (run) => {
    const merged = listsWithPending();
    setLists(merged);
    setPending(emptyPending());
    const next = { ...state, lists: merged };
    onDraft?.(next);
    run(next);
  };
  const submit = (e) => {
    e.preventDefault();
    searchWith(onSearch);
  };

  const field = (name, props) => (
    <ListField
      {...props}
      items={lists[name]}
      onAdd={(v) => add(name, v)}
      onRemove={(i) => remove(name, i)}
      onToggle={(i) => toggleNegate(name, i)}
      text={pending[name]}
      onTextChange={(v) => setPending((p) => ({ ...p, [name]: v }))}
    />
  );

  return (
    <form autoComplete="off" id="searchForm" onSubmit={submit}>
      {field("name", {
        id: "nameInput", label: "Card Name:", placeholder: "Words can be full or partial",
        randomOptions: NAME_RANDOM_OPTIONS,
        suggest: (text) => searchNames(cardNames, text),
        onRandom: async (key) =>
          key === "word" ? randomWord(await catalog("word-bank")) : randomName(await catalog("card-names")),
      })}

      {field("type", {
        id: "typeInput", label: "Card Types:", placeholder: "Including super- and/or subtypes",
        randomOptions: TYPE_OPTIONS, suggest: suggestTypes,
        onRandom: async (key) => pick(await typePool(key)),
      })}

      <fieldset id="colorsField">
        <legend>
          Color:
          <small>
            {COLOR_OPS.map(([value, text]) => (
              <label key={value}>
                <input type="radio" name="colorOps" value={value} checked={colorOp === value} onChange={() => setColorOp(value)} />
                {text}
              </label>
            ))}
          </small>
        </legend>
        {COLORS.map(([value, text]) => (
          <label key={value}>
            <input
              type="checkbox"
              checked={colors.has(value)}
              onChange={() => { setColorless(false); setColors((c) => toggle(c, value)); }}
            />{" "}
            {text}
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            checked={colorless}
            onChange={(e) => { setColorless(e.target.checked); if (e.target.checked) setColors(new Set()); }}
          />{" "}
          Colorless
        </label>
      </fieldset>

      {field("rules", {
        id: "rulesTextInput", label: "Rules Text:", placeholder: 'Individual words or "phrases in quotes"',
        randomOptions: RULES_OPTIONS, onRandom: async (key) => pick(await rulesPool(key)),
      })}

      <fieldset id="rarityField">
        <legend>Rarity:</legend>
        {RARITIES.map(([value, text]) => (
          <label key={value}>
            <input type="checkbox" checked={rarities.has(value)} onChange={() => setRarities((r) => toggle(r, value))} /> {text}
          </label>
        ))}
      </fieldset>

      {field("set", {
        id: "setInput", label: "Set:", placeholder: "Search for full name or set code",
        randomOptions: SET_OPTIONS, suggest: suggestSets, onRandom: async (key) => pick(await setPool(key)),
      })}

      {field("watermark", {
        id: "watermarkInput", label: "Watermark:", placeholder: "Ex. Abzan, Desparked",
        randomOptions: [{ value: "any", label: "Any Watermark" }],
        suggest: (text) =>
          watermarks.filter((w) => w.includes(text.toLowerCase().trim())).map((w) => ({ label: w, value: w })),
        onRandom: async () => pick(await catalog("watermarks")),
      })}

      {field("artist", {
        id: "artistInput", label: "Artist:", placeholder: "Full or partial artist name",
        randomOptions: [{ value: "any", label: "Any Artist" }],
        suggest: (text) => searchNames(artistNames, text, 8, (name) => name),
        onRandom: async () => pick(await catalog("artist-names")),
      })}

      {field("art", {
        id: "artInput", label: "Art / Concept:", placeholder: "Ex: calamity-beast, squirrel-horde",
        randomOptions: [{ value: "any", label: "Any Art Tag" }],
        suggest: (text) => searchTags(artTags, text),
        onRandom: async () => randomTag(await loadTags("art")) ?? pick(ART_TAGS),
      })}

      {field("function", {
        id: "functionInput", label: "Function / Cycle:", placeholder: "Ex: lifegain-matters, cycle-m15-sliver",
        randomOptions: [{ value: "any", label: "Any Function" }],
        suggest: (text) => searchTags(functionTags, text),
        onRandom: async () => randomTag(await loadTags("function")) ?? pick(FUNCTION_TAGS),
      })}

      <fieldset>
        <legend>Options:</legend>
        {[["firstPrintings", "First Printings Only"], ["includeExtras", "Include Extras"], ["isFunny", 'Only "Funny" Cards']].map(
          ([key, text]) => (
            <label key={key}>
              <input type="checkbox" checked={options[key]} onChange={(e) => setOptions((o) => ({ ...o, [key]: e.target.checked }))} /> {text}
            </label>
          )
        )}
      </fieldset>

      <section className="row">
        <div className="searchField">
          <label htmlFor="sortDropdown">Sort results by:</label>
          <select id="sortDropdown" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map(([value, text]) => (
              <option key={value} value={value}>{text}</option>
            ))}
          </select>
          <select aria-label="Sort direction" value={dir} onChange={(e) => setDir(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </section>

      <div className="buttonDiv">
        <button type="submit" id="allCardsBtn">All Cards</button>
        <button type="button" id="randomBtn" onClick={() => searchWith(onRandomCard)}>
          Randomizer!
        </button>
        <button type="button" id="resetBtn" onClick={onReset}>New Search</button>
      </div>
    </form>
  );
}
