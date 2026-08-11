import { execSync } from "node:child_process";

// Runs after the npm plugins bump package versions, so the release commit
// leaves package-lock.json in sync with the manifests it rewrites.
export function prepare(_pluginConfig, { cwd, logger }) {
  execSync("npm install --package-lock-only --ignore-scripts", { cwd, stdio: "inherit" });
  logger.log("Regenerated package-lock.json for the released versions");
}
