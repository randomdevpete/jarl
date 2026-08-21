import changelogSource from "../../../../CHANGELOG.md?raw";

export type ChangelogEntry = { version: string; date?: string; heading: string; body: string };

// Only `#`/`##` delimit entries: the generated notes put their own `### Features`/`### Bug Fixes`
// sections inside an entry, and matching those would cut every body off at the first section.
const HEADING_RE = /^(#{1,2})\s+(.*)$/;
const VERSION_RE = /v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)/;
const DATE_RE = /\((\d{4}-\d{2}-\d{2})\)/;
const FENCE_RE = /^```/;

/**
 * Splits the generated CHANGELOG.md into one entry per `##` version heading.
 * A non-version `#`/`##` heading closes the current entry without starting a new one.
 * Lines inside a fenced code block are never treated as headings, so an example release
 * note that happens to show a `##`/version-shaped line can't be mistaken for a real one.
 */
// Exported for unit tests, which feed it fixture markdown directly rather than the real
// CHANGELOG.md — the module-level `changelogEntries` below is what production code uses.
export const parseChangelogEntries = (markdown: string): ChangelogEntry[] => {
  const entries: ChangelogEntry[] = [];
  let current: { version: string; date?: string; heading: string; bodyLines: string[] } | null = null;
  let inFence = false;

  const flush = () => {
    if (current) {
      entries.push({
        version: current.version,
        date: current.date,
        heading: current.heading,
        body: current.bodyLines.join("\n").trim(),
      });
    }
    current = null;
  };

  for (const line of markdown.split("\n")) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      current?.bodyLines.push(line);
      continue;
    }
    if (inFence) {
      current?.bodyLines.push(line);
      continue;
    }

    const heading = line.match(HEADING_RE);
    const versionMatch = heading && heading[1] === "##" ? heading[2].match(VERSION_RE) : null;
    if (versionMatch) {
      flush();
      current = { version: versionMatch[1], date: line.match(DATE_RE)?.[1], heading: line, bodyLines: [] };
    } else if (heading) {
      flush();
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  flush();
  return entries;
};

/** Every release section in CHANGELOG.md, in the order they already appear there (newest first). */
export const changelogEntries: ChangelogEntry[] = parseChangelogEntries(changelogSource);

export const changelogEntryFor = (version: string): ChangelogEntry | undefined =>
  changelogEntries.find((entry) => entry.version === version);

/** The whole, unparsed CHANGELOG.md, for the "full history" view. */
export const fullChangelog = changelogSource;

/** Every concrete /changelog URL, for the docs site's SSG prerender list. */
export const changelogStaticPaths = (): string[] => [
  "/changelog",
  ...changelogEntries.map((entry) => `/changelog/${entry.version}`),
];
