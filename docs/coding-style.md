# Coding & commenting style

The binding style guide for this repository: code, comments and documentation. These rules are
incontrovertible — a genuine exception is justified **in place**, a one-line `exception:` note on
the deviating code saying why the rule doesn't apply, and the PR body lists every exception in the
diff. An unjustified deviation is review-rejectable on sight.

This is a subset of a broader internal guide that also covers workflow conventions with no bearing
on this repository's code. If a style question isn't answered here, raise it in the PR rather than
guessing — and if the answer turns out to be a rule this document is missing, add it here.

Five areas of code get distinctly different judgement: (1) code itself including configs, (2)
documentation comments, (3) inline comments, (4) human-facing documentation, (5) test code.

## Global principle

**Write less that means more.** A comment earns its place only by saying what the reader _cannot_
get from naming, types, nearby code, or general knowledge. When code needs explaining, first try
renaming or restructuring so it doesn't.

## Hard bans — all comment types

1. **No issue-tracker cross-referencing as a substitute for explanation.** A reference to an issue
   resolves for nobody reading only the code around it — write the reason instead. The sole
   exception is a marker for work explicitly deferred to a tracked GitHub issue in this repository,
   removed once it lands: `// will be fixed in #123`.
2. **No archeology.** No "used to X, now Y", no memorials to discarded alternatives, no
   design-history narration. Describe current state only. A commit ref ("changed in abc1234") is
   allowed only when the history is genuinely essential to understanding today's code.
3. **No restating the visible or the well-known.** Never explain what a well-named identifier, its
   type, or adjacent code already says; never define standard concepts (what an id is, what a
   default field does).
4. **No essays.** A comment longer than ~2 lines is presumptively wrong. One line beats four.
5. **No justification narration.** Comments state facts and constraints, not arguments for why the
   code is the way it is.
6. **No whimsy or fanciful prose.**
7. **No dead code**: no commented-out blocks, no stray unused imports. Delete it — git remembers.

Cross-references _within_ the codebase (`see packages/jarl-atoms/src/router.ts`) are fine and
useful.

## 1. Code itself (including configs)

- **Naming carries the load.** Names say precisely what a thing is or does, never its
  implementation (`SiteHeader`, not `StyledDiv`/`Wrapper`), and never conflate concepts (a tool
  that positions is `position`, not `place`-that-also-creates). Compound parts prefix with their
  parent (`RouteAtomTitle`).
- **Small, reviewable units.** Split large components/functions; hooks and tool modules get their
  own files. A file too big to review is a defect even with perfect comments.
- **DRY, applied completely.** One shared definition, imported everywhere; extracting a common
  definition includes migrating every existing usage. When one instance of a stale pattern is
  found, sweep the whole codebase for the rest.
- **No speculative backward compatibility pre-production.** Make fields required; delete
  migration/compat hedging.
- **Shared state is jotai atoms** — no ad-hoc stores, no event-publishing patterns, no
  Context-provider patterns for shared state. Server/client interaction feeds atoms reactively.
- **Root-cause fixes over patches.**
- **Generated files are gitignored** and reconstructed at build time.
- **Dependency hygiene**: cut unused deps; never keep a vulnerable dep nothing uses.
- **Configs follow the same comment rules**: comment only non-obvious constraints, never what a key
  self-evidently does.
- British English in identifiers and prose.

## 2. Documentation comments (function/param/prop docblocks)

- **A docblock is caller documentation**: what it's for, how to use it, non-obvious constraints and
  gotchas. Never internals, never how it came to be, never alternatives considered.
- **Full JSDoc (params/returns/props) only on public/exported library API** — the surface a
  consumer or docs generator sees (`jarl-atoms` and `jarl-react`'s exports). Internal functions get
  no docblock by default; at most a one-liner when the name genuinely can't carry it.
- **Self-evident members get nothing.** No doc comment on `id`, obvious props, or params whose
  name+type say it all. Document a param only when it has a non-obvious contract (units, valid
  range, "may be stale", ownership).
- **Default length: one line.** Multi-line only for a genuinely non-obvious usage contract.
- Implementation rationale, when truly needed, is a small inline comment next to the relevant code
  — not in the docblock.

## 3. Inline comments (inside function bodies)

- **Default is zero.** Straightforward app code has none; even complex library internals warrant
  roughly 3–8 per 100 lines, not per 10.
- Legitimate inline comments, always short:
  - **Trap/constraint notes** the reader can't see: `// Can't reuse the href here: it already has
the base path added; double basepaths otherwise`.
  - **Section signposts** in a longer function: `// Handle trailing slash` — a few words marking a
    step.
  - **Degradation intent**: `// Catch and log rather than blowing up during render`.
- **Small comments on specific steps, never one block covering the whole function.**
- TODO/FIXME comments get filed as a tracked issue and removed — don't accumulate them.

## 4. Human-facing documentation (README/tutorials/guides — md/html/jsx content)

The one place full prose belongs — written for a human reader, complete sentences, examples,
usage-relevant rationale. But:

- **No padding**: no marketing fluff, no restating the obvious, no narration of internals.
  Structure for scanning: headings, short sections, code examples over paragraphs.
- **Describes current state** — a doc is not a changelog; history lives in git and release notes.
- **Kept true**: a doc contradicting the code is a defect, fixed in the same PR that changed the
  behaviour.
- CLAUDE.md is operating instructions, not documentation: terse, minimal, updated as things change.
- API docs extracted from docblocks are area 2, not area 4 — don't inflate docblocks "for the docs
  site".

## 5. Test code

- **The test tells the story itself**: behavioural lowercase names (`test("it joins two route
paths")`), `describe` per unit, arrange–act–assert readable top to bottom, well-named fixtures.
- **Comments only for inconsistencies and irregularities**: a surprising fixture value, an
  environment-quirk workaround, an intentionally odd input. No narrating what an assertion
  obviously checks, no docblocks on tests.
- Multiple asserts per test are fine; scope repeated cases with bare blocks rather than
  copy-pasting tests.
