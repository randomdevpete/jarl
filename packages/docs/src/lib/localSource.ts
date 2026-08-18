import sourceFiles from "../content/generated/source-files.json";
import { githubRepoUrl } from "../layout/Layout";

const files = new Set(sourceFiles);

const SRC_PREFIX = "packages/docs/src/";

const resolveRelative = (fromSrcRelative: string, specifier: string): string => {
  const stack = fromSrcRelative.split("/").slice(0, -1);
  for (const part of specifier.split("/")) {
    if (part === "" || part === ".") continue;
    else if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
};

const CANDIDATE_SUFFIXES = [".tsx", ".ts", "/index.tsx", "/index.ts"];

/**
 * GitHub blob URL for a relative import specifier, resolved against the repo path of the file
 * it appears in. Undefined for a bare/package specifier, or one that resolves outside
 * `packages/docs/src/` or to a file that isn't actually there.
 */
export const localSourceUrl = (specifier: string, fromRepoPath: string): string | undefined => {
  if (!specifier.startsWith(".") || !fromRepoPath.startsWith(SRC_PREFIX)) return undefined;
  const base = resolveRelative(fromRepoPath.slice(SRC_PREFIX.length), specifier);
  const match = CANDIDATE_SUFFIXES.map((suffix) => `${SRC_PREFIX}${base}${suffix}`).find((candidate) =>
    files.has(candidate),
  );
  return match && `${githubRepoUrl}/blob/master/${match}`;
};
