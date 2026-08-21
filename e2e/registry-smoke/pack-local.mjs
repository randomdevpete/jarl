// Packs jarl-atoms/jarl-react from the working tree and installs the tarballs
// here, so the smoke consumer runs against this branch's build rather than
// whatever happens to be `latest` on the registry. See README.md for why:
// a registry-pinned `latest` install can't catch a source rename until the
// next release actually ships it, in a job nobody watches by default.
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const tarballDir = path.join(here, "tarballs");

rmSync(tarballDir, { recursive: true, force: true });
mkdirSync(tarballDir, { recursive: true });

for (const pkg of ["jarl-atoms", "jarl-react"]) {
  const pkgDir = path.join(repoRoot, "packages", pkg);
  const output = execFileSync("npm", ["pack", "--json", "--pack-destination", tarballDir], {
    cwd: pkgDir,
  }).toString();
  const [{ filename }] = JSON.parse(output);
  renameSync(path.join(tarballDir, filename), path.join(tarballDir, `${pkg}.tgz`));

  // npm doesn't detect a changed file: tarball under an unchanged version/spec:
  // package-lock.json pins the integrity hash from the first pack, and the
  // lockfile alone is enough for a repeat install to skip re-reading the
  // tarball. Both the lock and the extracted copy have to go.
  rmSync(path.join(here, "node_modules", pkg), { recursive: true, force: true });
}
rmSync(path.join(here, "package-lock.json"), { force: true });

execFileSync("npm", ["install"], { cwd: here, stdio: "inherit" });
