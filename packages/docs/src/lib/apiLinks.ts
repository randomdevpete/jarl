import jarlAtomsReference from "../content/generated/api-jarl-atoms.md?raw";
import jarlReactReference from "../content/generated/api-jarl-react.md?raw";
import type { ApiName } from "../router/routes";
import { slugify } from "./slug";

const HEADING = /^### `(\w+)`$/gm;

const linksFor = (apiName: ApiName, markdown: string): [string, string][] => {
  const counts = new Map<string, number>();
  return [...markdown.matchAll(HEADING)].map(([, name]) => [name, `/api/${apiName}#${slugify(name, counts)}`]);
};

/**
 * Every `jarl-atoms`/`jarl-react` export's name mapped to its API reference anchor, read
 * straight off the generated reference's own `### \`Name\`` headings so it can never drift
 * from the anchors `Markdown.tsx` actually renders.
 */
export const apiLinks: Map<string, string> = new Map([
  ...linksFor("jarl-atoms", jarlAtomsReference),
  ...linksFor("jarl-react", jarlReactReference),
]);
