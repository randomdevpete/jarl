import { apiLinks } from "./apiLinks";
import { localSourceUrl } from "./localSource";

// Splits highlighted HTML into alternating tag/text tokens, so text runs can be linked without
// touching the `hljs-*` spans themselves.
const TOKEN = /(<[^>]+>)|([^<]+)/g;
const CLASS_ATTR = /class="([^"]*)"/;
const IDENTIFIER = /\b[A-Za-z_$][\w$]*\b/g;
// highlight.js escapes both quote styles as HTML entities (see its `escapeHTML`), so the
// literal characters never appear in the text run - match the entities, not the characters.
const IMPORT_SPECIFIER = /^(&quot;|&#x27;)(\.\.?\/[^"'&]*)(&quot;|&#x27;)$/;

const linkIdentifiers = (text: string): string =>
  text.replace(IDENTIFIER, (word) => {
    const href = apiLinks.get(word);
    return href ? `<a href="${href}">${word}</a>` : word;
  });

const linkImportSpecifier = (text: string, sourcePath: string): string => {
  const match = IMPORT_SPECIFIER.exec(text);
  if (!match) return text;
  const [, openQuote, specifier, closeQuote] = match;
  const href = localSourceUrl(specifier, sourcePath);
  return href ? `${openQuote}<a href="${href}">${specifier}</a>${closeQuote}` : text;
};

/**
 * Wraps recognised identifiers and import specifiers in already-highlighted HTML (as produced
 * by `highlightToHtml`) with links to their source: a `jarl-atoms`/`jarl-react` export links to
 * its API reference entry, and - when `sourcePath` names the repo path of the file being shown -
 * a local relative import links to that file on GitHub. Tracks each text run's enclosing
 * `hljs-*` span so string/comment contents are left alone, other than a bare import specifier.
 */
export const linkifyHtml = (html: string, sourcePath?: string): string => {
  const openClasses: string[] = [];
  let output = "";
  for (const [, tag, text] of html.matchAll(TOKEN)) {
    if (tag) {
      output += tag;
      if (tag.startsWith("</")) openClasses.pop();
      else openClasses.push(CLASS_ATTR.exec(tag)?.[1] ?? "");
      continue;
    }
    const currentClass = openClasses[openClasses.length - 1] ?? "";
    if (currentClass.includes("hljs-string")) {
      output += sourcePath ? linkImportSpecifier(text ?? "", sourcePath) : (text ?? "");
    } else if (currentClass.includes("hljs-comment")) {
      output += text ?? "";
    } else {
      output += linkIdentifiers(text ?? "");
    }
  }
  return output;
};
