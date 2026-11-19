import { useEffect, useMemo, useState } from "react";
import ListField from "./ListField.jsx";
import StatField from "./StatField.jsx";
import Collapsible from "./Collapsible.jsx";
import { useHiddenSet } from "../utils/useHiddenSet";
import { useBelowHeader } from "../utils/useBelowHeader";
import { normalizeStatValue } from "../utils/stats";
import { allSets, catalog } from "../utils/scryfall";
import { loadTags, searchTags, randomTag } from "../utils/tags";
import { LIST_KEYS, parseNegation } from "../utils/searchParams";
import { SORTS } from "../data/sorts";
import {
  searchNames,
  randomName,
  randomWord,
  NAME_RANDOM_OPTIONS,
} from "../utils/names";
import {
  TYPE_OPTIONS,
  RULES_OPTIONS,
  SET_OPTIONS,
  ART_TAGS,
  FUNCTION_TAGS,
  typePool,
  rulesPool,
  setPool,
  allTypes,
  setItem,
} from "../data/pools";

const COLORS = [
  ["w", "White"],
  ["u", "Blue"],
  ["b", "Black"],
  ["r", "Red"],
  ["g", "Green"],
];
const COLOR_OPS = [
  ["and", "Exactly"],
  ["or", "Including"],
  ["not", "Excluding"],
  ["id", "Identity (EDH)"],
];
const RARITIES = [
  ["c", "Common"],
  ["u", "Uncommon"],
  ["r", "Rare"],
  ["m", "Mythic Rare"],
];

// Fields that can be shown or hidden from the "Customize fields" panel
const FIELDS = [
  ["name", "Card Name"], ["type", "Card Types"], ["color", "Color"], ["rules", "Rules Text"],
  ["rarity", "Rarity"], ["stats", "Stats"], ["set", "Set"], ["watermark", "Watermark"],
  ["artist", "Artist"], ["art", "Art / Concept"], ["function", "Function / Cycle"],
  ["options", "Options"], ["sort", "Sort"],
];

const emptyPending = () => Object.fromEntries(LIST_KEYS.map((k) => [k, ""]));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const asItem = (v) => (typeof v === "string" ? { label: v, value: v } : v);
const toggle = (set, v) => {
  const next = new Set(set);
  next.has(v) ? next.delete(v) : next.add(v);
  return next;
};

export default function SearchForm({
  initial,
  onSearch,
  onRandomCard,
  onDraft,
  onReset,
}) {
  const [lists, setLists] = useState(initial.lists);
  const [colors, setColors] = useState(initial.colors);
  const [colorless, setColorless] = useState(initial.colorless);
  const [colorOp, setColorOp] = useState(initial.colorOp);
  const [rarities, setRarities] = useState(initial.rarities);
  const [options, setOptions] = useState(initial.options);
  const [sort, setSort] = useState(initial.sort);
  const [dir, setDir] = useState(initial.dir);
  const [stats, setStats] = useState(initial.stats ?? []);
  const [statDraft, setStatDraft] = useState({ stat: "mv", op: "=", value: "" }); // the stat row's inputs
  const [statError, setStatError] = useState("");
  const dockTop = useBelowHeader(); // keeps the options square under the site header
  const [hiddenFields, toggleField, showAllFields, hideAllFields] = useHiddenSet("cardConclaveHiddenFields");
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
    allTypes()
      .then(setTypeNames)
      .catch(() => {});
    allSets()
      .then(setSets)
      .catch(() => {});
    catalog("card-names")
      .then(setCardNames)
      .catch(() => {});
    catalog("artist-names")
      .then(setArtistNames)
      .catch(() => {});
    catalog("watermarks")
      .then(setWatermarks)
      .catch(() => {});
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
        item.value = item.label = text
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");
      }
    }
    if (field === "set") {
      // Resolve typed set names/codes to a code Scryfall understands
      const q = item.value.toLowerCase();
      const found = sets.find(
        (s) => s.code === q || s.name.toLowerCase() === q,
      );
      if (found) Object.assign(item, setItem(found));
    }
    return item;
  };
  const has = (items, item) =>
    items.some((i) => i.value === item.value && !!i.negate === !!item.negate);

  const add = (field, value) => {
    const item = makeItem(field, value);
    setLists((l) =>
      has(l[field], item) ? l : { ...l, [field]: [...l[field], item] },
    );
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
  const hasStat = (items, s) =>
    items.some((i) => i.stat === s.stat && i.op === s.op && i.value === s.value);
  const addStat = () => {
    const value = normalizeStatValue(statDraft.value);
    if (!value) {
      setStatError("Enter a number, such as 3 or 2.5.");
      return;
    }
    const item = { stat: statDraft.stat, op: statDraft.op, value };
    setStats((list) => (hasStat(list, item) ? list : [...list, item]));
    setStatDraft((d) => ({ ...d, value: "" })); // keep the stat and comparison, handy for adding a range
    setStatError("");
  };

  const remove = (field, index) =>
    setLists((l) => ({
      ...l,
      [field]: l[field].filter((_, i) => i !== index),
    }));

  const toggleNegate = (field, index) =>
    setLists((l) => ({
      ...l,
      [field]: l[field].map((item, i) =>
        i === index ? { ...item, negate: !item.negate } : item,
      ),
    }));

  const suggestTypes = useMemo(() => {
    const unique = [...new Set(typeNames)];
    return (text) =>
      unique
        .filter((t) => t.toLowerCase().includes(text.toLowerCase()))
        .map((t) => ({ label: t, value: t }));
  }, [typeNames]);
  const suggestSets = (text) =>
    sets
      .filter(
        (s) =>
          s.name.toLowerCase().includes(text.toLowerCase()) ||
          s.code === text.toLowerCase(),
      )
      .map(setItem);

  const state = {
    lists,
    colors,
    colorless,
    colorOp,
    rarities,
    options,
    sort,
    dir,
    stats,
  };

  // Keep a draft so the form is still filled in when you come back from the results page
  useEffect(() => {
    onDraft?.(state);
  }, [lists, colors, colorless, colorOp, rarities, options, sort, dir, stats]);

  // Fold typed-but-unadded text into the chips, remember it for Back, then search
  const searchWith = (run) => {
    // A stat typed in the box but not yet added counts too, as long as it's a number
    let mergedStats = stats;
    if (statDraft.value.trim()) {
      const value = normalizeStatValue(statDraft.value);
      if (!value) {
        setStatError("Enter a number, such as 3 or 2.5.");
        return;
      }
      const item = { stat: statDraft.stat, op: statDraft.op, value };
      if (!hasStat(stats, item)) mergedStats = [...stats, item];
    }
    const merged = listsWithPending();
    setLists(merged);
    setStats(mergedStats);
    setPending(emptyPending());
    setStatDraft((d) => ({ ...d, value: "" }));
    setStatError("");
    const next = { ...state, lists: merged, stats: mergedStats };
    onDraft?.(next);
    run(next);
  };
  const submit = (e) => {
    e.preventDefault();
    searchWith(onSearch);
  };

  // A field only disappears while it's empty, so a hidden field never quietly affects a search
  const hasContent = (key) => {
    switch (key) {
      case "color": return colors.size > 0 || colorless;
      case "rarity": return rarities.size > 0;
      case "stats": return stats.length > 0 || statDraft.value.trim() !== "";
      case "options": return Object.values(options).some(Boolean);
      case "sort": return sort !== "type" || dir !== "asc";
      default: return lists[key].length > 0 || pending[key].trim() !== "";
    }
  };
  const shown = (key) => !hiddenFields.has(key) || hasContent(key);

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
      {/* A small square fixed to the top right of the screen; it opens into the options panel */}
      <Collapsible
        overlay
        className="customizeDock"
        style={dockTop == null ? undefined : { "--dock-top": `${dockTop}px` }}
        summary={
          <>
            <span className="dockIcon" title="Customize fields" aria-hidden="true" />
            <span className="srOnly">Customize fields</span>
          </>
        }
      >
        <p className="dockTitle">Customize fields</p>
        <div className="fieldToggles">
          {FIELDS.map(([key, text]) => (
            <label key={key}>
              <input type="checkbox" checked={!hiddenFields.has(key)} onChange={() => toggleField(key)} /> {text}
              {hiddenFields.has(key) && hasContent(key) && <span className="inUse"> (in use)</span>}
            </label>
          ))}
        </div>
        <p className="toggleNote">
          Unchecked fields stay hidden on your next visit. A field with something in it stays visible until you clear it.
        </p>
        <div className="panelTools dockTools">
          <button type="button" className="linkButton" onClick={showAllFields}>Show all</button>
          <button
            type="button"
            className="linkButton"
            onClick={() => hideAllFields(FIELDS.map(([key]) => key))}
          >
            Clear all
          </button>
        </div>
      </Collapsible>

      {shown("name") && field("name", {
        id: "nameInput",
        label: "Card Name:",
        placeholder: "Words can be full or partial",
        randomOptions: NAME_RANDOM_OPTIONS,
        suggest: (text) => searchNames(cardNames, text),
        onRandom: async (key) =>
          key === "word"
            ? randomWord(await catalog("word-bank"))
            : randomName(await catalog("card-names")),
      })}

      {shown("type") && field("type", {
        id: "typeInput",
        label: "Card Types:",
        placeholder: "Including super- and/or subtypes",
        randomOptions: TYPE_OPTIONS,
        suggest: suggestTypes,
        onRandom: async (key) => pick(await typePool(key)),
      })}

      {shown("color") && (
      <fieldset id="colorsField">
        <legend>
          Color:
          <small>
            {COLOR_OPS.map(([value, text]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="colorOps"
                  value={value}
                  checked={colorOp === value}
                  onChange={() => setColorOp(value)}
                />
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
              onChange={() => {
                setColorless(false);
                setColors((c) => toggle(c, value));
              }}
            />{" "}
            {text}
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            checked={colorless}
            onChange={(e) => {
              setColorless(e.target.checked);
              if (e.target.checked) setColors(new Set());
            }}
          />{" "}
          Colorless
        </label>
      </fieldset>
      )}

      {shown("rules") && field("rules", {
        id: "rulesTextInput",
        label: "Rules Text:",
        placeholder: 'Individual words or "phrases in quotes"',
        randomOptions: RULES_OPTIONS,
        onRandom: async (key) => pick(await rulesPool(key)),
      })}

      {shown("rarity") && (
      <fieldset id="rarityField">
        <legend>Rarity:</legend>
        {RARITIES.map(([value, text]) => (
          <label key={value}>
            <input
              type="checkbox"
              checked={rarities.has(value)}
              onChange={() => setRarities((r) => toggle(r, value))}
            />{" "}
            {text}
          </label>
        ))}
      </fieldset>
      )}

      {shown("stats") && <StatField
        items={stats}
        draft={statDraft}
        onDraftChange={(patch) => {
          setStatDraft((d) => ({ ...d, ...patch }));
          setStatError("");
        }}
        onAdd={addStat}
        onRemove={(i) => setStats((list) => list.filter((_, j) => j !== i))}
        error={statError}
      />}

      {shown("set") && field("set", {
        id: "setInput",
        label: "Set:",
        placeholder: "Search for full name or set code",
        randomOptions: SET_OPTIONS,
        suggest: suggestSets,
        onRandom: async (key) => pick(await setPool(key)),
      })}

      {shown("watermark") && field("watermark", {
        id: "watermarkInput",
        label: "Watermark:",
        placeholder: "Ex. Abzan, Desparked",
        randomOptions: [{ value: "any", label: "Any Watermark" }],
        suggest: (text) =>
          watermarks
            .filter((w) => w.includes(text.toLowerCase().trim()))
            .map((w) => ({ label: w, value: w })),
        onRandom: async () => pick(await catalog("watermarks")),
      })}

      {shown("artist") && field("artist", {
        id: "artistInput",
        label: "Artist:",
        placeholder: "Full or partial artist name",
        randomOptions: [{ value: "any", label: "Any Artist" }],
        suggest: (text) => searchNames(artistNames, text, 8, (name) => name),
        onRandom: async () => pick(await catalog("artist-names")),
      })}

      {shown("art") && field("art", {
        id: "artInput",
        label: "Art / Concept:",
        placeholder: "Ex: calamity beast, squirrel horde",
        randomOptions: [{ value: "any", label: "Any Art Tag" }],
        suggest: (text) => searchTags(artTags, text),
        onRandom: async () =>
          randomTag(await loadTags("art")) ?? pick(ART_TAGS),
      })}

      {shown("function") && field("function", {
        id: "functionInput",
        label: "Function / Cycle:",
        placeholder: "Ex: lifegain matters, cycle-m15-sliver",
        randomOptions: [{ value: "any", label: "Any Function" }],
        suggest: (text) => searchTags(functionTags, text),
        onRandom: async () =>
          randomTag(await loadTags("function")) ?? pick(FUNCTION_TAGS),
      })}

      {shown("options") && (
      <fieldset>
        <legend>Options:</legend>
        {[
          ["firstPrintings", "First Printings Only"],
          ["includeExtras", "Include Extras"],
          ["isFunny", 'Only "Funny" Cards'],
        ].map(([key, text]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(e) =>
                setOptions((o) => ({ ...o, [key]: e.target.checked }))
              }
            />{" "}
            {text}
          </label>
        ))}
      </fieldset>
      )}

      {shown("sort") && (
      <section className="row">
        <div className="searchField">
          <label htmlFor="sortDropdown">Sort results by:</label>
          <select
            id="sortDropdown"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORTS.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort direction"
            value={dir}
            onChange={(e) => setDir(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </section>
      )}

      <div className="buttonDiv">
        <button type="submit" id="allCardsBtn">
          All Cards
        </button>
        <button
          type="button"
          id="randomBtn"
          onClick={() => searchWith(onRandomCard)}
        >
          Randomizer!
        </button>
        <button type="button" id="resetBtn" onClick={onReset}>
          New Search
        </button>
      </div>
    </form>
  );
}
