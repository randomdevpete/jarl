import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { linkifyHtml } from "./codeLinks";

// Import from core (not full bundle) to optimize bundle size.
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("jsx", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => HTML_ESCAPES[char] ?? char);
}

/**
 * Highlights a code snippet to an HTML string of `hljs-*`-classed spans (no wrapping
 * `pre`/`code`), with any recognised `jarl-atoms`/`jarl-react` identifier linked to its API
 * reference entry - see `codeLinks.ts`. Falls back to auto-detection when `lang` is missing or
 * unregistered, and to escaped-but-unhighlighted text if even that fails - a malformed snippet
 * shouldn't break the page it's on. Runs identically on server and client (see `Markdown.tsx`),
 * so output never differs between the two.
 */
export function highlightToHtml(code: string, lang?: string): string {
  const language = lang && hljs.getLanguage(lang) ? lang : undefined;
  let html: string;
  try {
    html = language ? hljs.highlight(code, { language, ignoreIllegals: true }).value : hljs.highlightAuto(code).value;
  } catch {
    return escapeHtml(code);
  }
  return linkifyHtml(html);
}
