export function buildTitleSuggestions(expenses = []) {
  const byKey = new Map();

  expenses.forEach((expense) => {
    const title = String(expense.title || "").trim();
    if (title.length < 2) return;

    const key = title.toLocaleLowerCase("es-MX");
    const category = String(expense.category || "").trim();
    const current = byKey.get(key) || {
      title,
      count: 0,
      categories: new Map(),
    };

    current.count += 1;
    if (title.length > current.title.length) current.title = title;
    if (category) {
      current.categories.set(category, (current.categories.get(category) || 0) + 1);
    }
    byKey.set(key, current);
  });

  return [...byKey.values()]
    .map((item) => {
      let category = "";
      let best = 0;
      item.categories.forEach((uses, name) => {
        if (uses > best) {
          best = uses;
          category = name;
        }
      });
      return { title: item.title, category, count: item.count };
    })
    .sort((a, b) => b.count - a.count);
}

export function matchTitleSuggestions(suggestions, query, limit = 8) {
  const needle = String(query || "").trim().toLocaleLowerCase("es-MX");
  if (!needle) return [];

  return suggestions
    .filter((item) => item.title.toLocaleLowerCase("es-MX").includes(needle))
    .slice(0, limit);
}
