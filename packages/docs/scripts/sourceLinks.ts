// Lists every TypeScript source file under the docs site's own src/, as repo-relative paths,
// so `lib/localSource.ts` can resolve a demo's relative imports to a GitHub link without
// needing Vite's module graph at render time.
import fs from "node:fs";
import path from "node:path";

const walk = (dir: string, root: string, out: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, root, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(path.relative(root, full).split(path.sep).join("/"));
  }
  return out;
};

export interface WriteSourceFilesOptions {
  srcDir: string;
  repoRoot: string;
  outputPath: string;
}

/** Writes the sorted file list to `outputPath`, and reports whether that changed anything. */
export const writeSourceFiles = ({ srcDir, repoRoot, outputPath }: WriteSourceFilesOptions): boolean => {
  const files = walk(srcDir, repoRoot).sort();
  const json = `${JSON.stringify(files, null, 2)}\n`;
  if (fs.existsSync(outputPath) && fs.readFileSync(outputPath, "utf-8") === json) return false;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, json, "utf-8");
  return true;
};
