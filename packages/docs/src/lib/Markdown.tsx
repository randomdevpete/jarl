import styled from "@emotion/styled";
import { marked } from "marked";
import { useMemo } from "react";
import { theme } from "../theme";
import { escapeHtml, highlightToHtml } from "./highlight";

marked.setOptions({ gfm: true });

// Slugified per document (Markdown's useMemo clears this before each parse) so headings get
// stable, GitHub-style #anchors without pulling in a whole extension for it. Repeats within one
// document get a numeric suffix, same convention GitHub uses.
const headingSlugCounts = new Map<string, number>();

const slugify = (raw: string): string => {
  const base = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const count = headingSlugCounts.get(base) ?? 0;
  headingSlugCounts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
};

marked.use({
  renderer: {
    code(code, infostring) {
      const lang = (infostring ?? "").trim().split(/\s+/)[0];
      const languageAttr = lang ? ` data-language="${escapeHtml(lang)}"` : "";
      return `<pre class="hljs"${languageAttr}><code>${highlightToHtml(code, lang)}</code></pre>`;
    },
    heading(text, depth, raw) {
      const id = slugify(raw);
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
  },
});

const MarkdownBody = styled.div`
  h1:first-child {
    margin-top: 0;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
  }

  th,
  td {
    border: 1px solid ${theme.border};
    padding: 0.5rem 0.75rem;
    text-align: left;
  }
`;

/** Renders a markdown source string. Runs identically on server and client, so there's no hydration mismatch. */
export const Markdown = ({ source }: { source: string }) => {
  const html = useMemo(() => {
    headingSlugCounts.clear();
    return marked.parse(source, { async: false }) as string;
  }, [source]);
  // eslint-disable-next-line react/no-danger
  return <MarkdownBody dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Markdown;
