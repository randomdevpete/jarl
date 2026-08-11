import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Pins workspace-internal dependency ranges to the exact lockstep release version — a caret
// range anchored on one prerelease tuple never matches the next (2.0.1-beta.1 ∉ ^2.0.0-beta.1).
export function prepare(_pluginConfig, { cwd, nextRelease, logger }) {
  const manifests = readdirSync(join(cwd, "packages")).map((dir) => {
    const path = join(cwd, "packages", dir, "package.json");
    return { path, pkg: JSON.parse(readFileSync(path, "utf8")) };
  });
  const released = new Set(manifests.filter(({ pkg }) => !pkg.private).map(({ pkg }) => pkg.name));

  for (const { path, pkg } of manifests) {
    let changed = false;
    for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
      for (const name of Object.keys(pkg[section] ?? {})) {
        if (released.has(name) && pkg[section][name] !== nextRelease.version) {
          pkg[section][name] = nextRelease.version;
          changed = true;
        }
      }
    }
    if (changed) {
      writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
      logger.log(`Pinned internal dependencies in ${path} to ${nextRelease.version}`);
    }
  }
}
