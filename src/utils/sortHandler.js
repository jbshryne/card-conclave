// Scryfall can't order by type line, so results are sorted client-side.
const RARITY_RANK = { common: 0, uncommon: 1, rare: 2, mythic: 3, special: 4, bonus: 5 };
const NUMERIC = ["cmc", "power", "toughness"];

export function joinIfArray(value) {
  if (Array.isArray(value)) return value.join("");
  return value == null ? "" : String(value);
}

function sortFnc(a, b, param) {
  if (param === "rarity") {
    return (RARITY_RANK[a.rarity] ?? 9) - (RARITY_RANK[b.rarity] ?? 9);
  }
  if (NUMERIC.includes(param)) {
    return (parseFloat(a[param]) || 0) - (parseFloat(b[param]) || 0);
  }
  return joinIfArray(a[param])
    .toLowerCase()
    .localeCompare(joinIfArray(b[param]).toLowerCase());
}

export function sortHandler(array, primeParam, secondParam, thirdParam) {
  const sorted = [...array];

  sorted.sort((a, b) => {
    const primeOfA = joinIfArray(a[primeParam]).toLowerCase();
    const primeOfB = joinIfArray(b[primeParam]).toLowerCase();
    if (primeOfA !== primeOfB) return sortFnc(a, b, primeParam);

    if (secondParam) {
      const secondOfA = joinIfArray(a[secondParam]).toLowerCase();
      const secondOfB = joinIfArray(b[secondParam]).toLowerCase();
      if (secondOfA !== secondOfB) return sortFnc(a, b, secondParam);
    }

    if (thirdParam) {
      const thirdOfA = joinIfArray(a[thirdParam]).toLowerCase();
      const thirdOfB = joinIfArray(b[thirdParam]).toLowerCase();
      if (thirdOfA !== thirdOfB) return sortFnc(a, b, thirdParam);
    }

    return a.name.localeCompare(b.name); // stable, readable tiebreak
  });

  return sorted;
}
