import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { analyzeCommits } from "@semantic-release/commit-analyzer";

// Narrows semantic-release's "run at all" decision to the pushed range, so a docs-only push
// can't sweep an older unreleased feat into a surprise minor.
// Usage: node scripts/push-warrants-release.mjs <base-sha> [head-sha]

const ANALYZER = "@semantic-release/commit-analyzer";
const CONVENTIONAL_HEADER = /^\w+(\([^)]*\))?!?: ./;
const RECORD = "\u001f";

const [base, head = "HEAD"] = process.argv.slice(2);
const cwd = process.cwd();

function analyzerConfig() {
  const { plugins } = JSON.parse(readFileSync(`${cwd}/.releaserc.json`, "utf8"));
  const entry = plugins.find((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) === ANALYZER);
  if (!entry) throw new Error(`.releaserc.json has no ${ANALYZER} plugin entry`);
  return Array.isArray(entry) ? (entry[1] ?? {}) : {};
}

function isReachable(rev) {
  try {
    execFileSync("git", ["cat-file", "-e", `${rev}^{commit}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function commitsIn(range) {
  const log = execFileSync("git", ["log", "-z", `--format=%H${RECORD}%B`, range], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return log
    .split("\0")
    .filter(Boolean)
    .map((entry) => {
      const [hash, message] = entry.split(RECORD);
      return { hash, message: message.trim() };
    });
}

async function warrantsRelease() {
  // A missing base (branch just created) or an unreachable one (history rewritten) leaves nothing
  // to narrow to; release whatever is outstanding rather than silently dropping it.
  if (!base || /^0+$/.test(base) || !isReachable(base)) {
    console.log(`No usable base commit (${base || "none given"}) — releasing whatever is outstanding.`);
    return true;
  }

  const commits = commitsIn(`${base}..${head}`);
  if (commits.length === 0) {
    console.log(`No commits in ${base}..${head}.`);
    return false;
  }

  for (const { hash, message } of commits) {
    const subject = message.split("\n")[0];
    if (!CONVENTIONAL_HEADER.test(subject)) {
      console.log(
        `::warning::${hash.slice(0, 8)} has no Conventional Commits type, so no release rule can ever ` +
          `match it: ${subject}`,
      );
    }
  }

  const releaseType = await analyzeCommits(analyzerConfig(), { commits, cwd, logger: console });
  console.log(`Commits in ${base}..${head} warrant: ${releaseType ?? "no release"}.`);
  return releaseType !== null;
}

const release = await warrantsRelease();
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `release=${release}\n`);
