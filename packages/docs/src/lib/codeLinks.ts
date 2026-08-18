import { apiLinks } from "./apiLinks";

// Splits highlighted HTML into alternating tag/text tokens, so text runs can be linked without
// touching the `hljs-*` spans themselves.
const TOKEN = /(<[^>]+>)|([^<]+)/g;
const CLASS_ATTR = /class="([^"]*)"/;
const IDENTIFIER = /\b[A-Za-z_$][\w$]*\b/g;

const linkIdentifiers = (text: string): string =>
  text.replace(IDENTIFIER, (word) => {
    const href = apiLinks.get(word);
    return href ? `<a href="${href}">${word}</a>` : word;
  });

/**
 * Wraps recognised identifiers in already-highlighted HTML (as produced by `highlightToHtml`)
 * with links to their API reference entry - any `jarl-atoms`/`jarl-react` export. Tracks each
 * text run's enclosing `hljs-*` span so string/comment contents are left alone.
 */
export const linkifyHtml = (html: string): string => {
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
    if (currentClass.includes("hljs-string") || currentClass.includes("hljs-comment")) {
      output += text ?? "";
    } else {
      output += linkIdentifiers(text ?? "");
    }
  }
  return output;
};
