import { writeFileSync } from "node:fs";
import path from "node:path";
import {
  currentBranch,
  devPortBase,
  DOCS_DEV_PORT_OFFSET,
  DOCS_PREVIEW_PORT_OFFSET,
  E2E_FIXTURE_PORT_OFFSET,
  getTaskId,
} from "./devPorts.mts";

const ENV_FILE = path.resolve(import.meta.dirname, "../.env.ports");

const branch = currentBranch() ?? "master";
const base = devPortBase(getTaskId());

const OFFSETS = {
  docs: DOCS_DEV_PORT_OFFSET,
  "docs preview": DOCS_PREVIEW_PORT_OFFSET,
  "e2e fixture": E2E_FIXTURE_PORT_OFFSET,
} as const;

console.log(`${branch}: block ${base}–${base + 9}`);
for (const [service, offset] of Object.entries(OFFSETS)) {
  console.log(`  +${offset} ${service.padEnd(13)} ${base + offset}`);
}

if (process.argv.includes("--write-env")) {
  writeFileSync(
    ENV_FILE,
    [
      `PORT_DOCS=${base + DOCS_DEV_PORT_OFFSET}`,
      `PORT_DOCS_PREVIEW=${base + DOCS_PREVIEW_PORT_OFFSET}`,
      `PORT_E2E_FIXTURE=${base + E2E_FIXTURE_PORT_OFFSET}`,
      "",
    ].join("\n"),
  );
  console.log(`Wrote ${ENV_FILE}`);
}
