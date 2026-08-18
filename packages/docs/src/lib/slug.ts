/**
 * GitHub-style slug for a heading: lowercased, non-alphanumeric runs collapsed to a single
 * hyphen, trimmed. Repeats within `counts` get a numeric suffix, the same convention GitHub
 * uses - pass a fresh `Map` per document so counts don't leak between them.
 */
export function slugify(raw: string, counts: Map<string, number>): string {
  const base = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}
