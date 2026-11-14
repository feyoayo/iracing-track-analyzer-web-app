const CLASS_SLUGS = [
  ["Sports Car", "sports-car"],
  ["Formula", "formula"],
  ["Oval", "oval"],
  ["Other", "other"],
] as const;

export function readClassesQuery(search: string, availableClasses: string[]): string[] | null {
  const params = new URLSearchParams(search);
  if (!params.has("classes")) return null;
  const value = params.getAll("classes").join(",");
  if (!value.trim()) return [];
  const slugs = new Set(value.split(",").map(value => value.trim().toLowerCase()));
  const selected = CLASS_SLUGS
    .filter(([name, slug]) => availableClasses.includes(name) && slugs.has(slug))
    .map(([name]) => name);
  return selected.length ? selected : null;
}

export function writeClassesQuery(url: URL, selectedClasses: string[]): string {
  const next = new URL(url);
  next.searchParams.set("classes", CLASS_SLUGS
    .filter(([name]) => selectedClasses.includes(name))
    .map(([, slug]) => slug)
    .join(","));
  return `${next.pathname}${next.search}${next.hash}`;
}
