import { execFileSync } from "node:child_process";

/**
 * Deterministic per-worktree dev server ports (TODOS `DEV-SERVERS.md`).
 *
 * Every worktree/branch is named `task-<id>-...` or `master`. Each owns a contiguous ten-port
 * block, `10000 + 10 × (id mod 1000)` … `+ 9` — ticket 475 owns 14750–14759, the docs dev server
 * on 14750 (`+0`). A service takes one offset inside its own worktree's block and nothing outside
 * it; `devPort` throws for an offset outside 0–9.
 *
 * `master` is not a ticket, so it is allocated per project instead: the reserved pseudo-id `-1`,
 * shifted by this project's row in `board/projects.md` before the same formula applies. jarl is
 * row 2, so its `master` worktree owns 9970–9979.
 */
const PROJECT_ORDINAL = 2;

/** The docs site's SSR dev server (`npm run dev`). */
export const DOCS_DEV_PORT_OFFSET = 0;

/** `vite preview` over the built docs site (`npm run docs:preview`). */
export const DOCS_PREVIEW_PORT_OFFSET = 5;

/** The Vite fixture app the Playwright suite drives (`e2e/fixture-app`). */
export const E2E_FIXTURE_PORT_OFFSET = 6;

/**
 * The numeric id this worktree's block derives from: a ticket's own id for `task-<id>-...`, and
 * `-1` for `master` or anything else unrecognised (a stray branch, a detached HEAD) — warning in
 * the latter case, since it silently falls back to the standing `master` block.
 */
export function parseTaskId(branch: string): number {
  const match = /^task-(\d+)-/.exec(branch);
  if (match) return Number(match[1]);
  if (branch === "master") return -1;
  console.warn(`devPorts: unrecognised branch "${branch}" — falling back to this worktree's master block`);
  return -1;
}

/**
 * The current git branch name for `cwd`, or null if it can't be determined (git missing, detached
 * HEAD, not a git checkout, ...). `git` resolves the repo root by walking up from `cwd`, so this
 * works no matter how deep inside a worktree it's called from.
 */
export function currentBranch(cwd: string = process.cwd()): string | null {
  try {
    const out = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out === "" || out === "HEAD" ? null : out;
  } catch {
    return null;
  }
}

/** This worktree's task id, derived from its current git branch name. */
export function getTaskId(cwd: string = process.cwd()): number {
  const branch = currentBranch(cwd);
  if (branch === null) {
    console.warn("devPorts: couldn't determine this worktree's git branch — falling back to the master block");
    return -1;
  }
  return parseTaskId(branch);
}

/**
 * The base port of the ten-port block a task id owns. The standing pseudo-id `master` uses
 * (negative) is shifted by `ordinal` — a project's row in `board/projects.md` — first; ticket ids
 * are globally unique and pass through unshifted. `ordinal` defaults to this project's own
 * `PROJECT_ORDINAL`; it's a parameter so the shift itself is testable independently of jarl being
 * row 2.
 */
export function devPortBase(taskId: number, ordinal: number = PROJECT_ORDINAL): number {
  const override = process.env["DEV_PORT_BASE"];
  if (override !== undefined) return Number(override);
  const effectiveId = taskId < 0 ? taskId - 2 * (ordinal - 1) : taskId;
  return 10000 + 10 * (effectiveId % 1000);
}

/**
 * The deterministic dev port for a service given its offset within a worktree's block (e.g.
 * `DOCS_DEV_PORT_OFFSET`) and a task id — pass one explicitly, or omit it to derive it from the
 * current worktree's git branch via `getTaskId()`.
 */
export function devPort(offset: number, taskId: number = getTaskId()): number {
  if (!Number.isInteger(offset) || offset < 0 || offset > 9) {
    throw new Error(`Dev port offset ${offset} is outside a worktree's ten-port block (0-9).`);
  }
  return devPortBase(taskId) + offset;
}
