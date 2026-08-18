import styled from "@emotion/styled";
import { marked } from "marked";
import { useMemo } from "react";
import { theme } from "../theme";
import { escapeHtml, highlightToHtml } from "./highlight";
import { slugify } from "./slug";

marked.setOptions({ gfm: true });

// Cleared before each parse (Markdown's useMemo) so headings get stable, GitHub-style
// #anchors without pulling in a whole extension for it - see `apiLinks.ts` for the other
// consumer of the same scheme.
const headingSlugCounts = new Map<string, number>();

marked.use({
  renderer: {
    code(code, infostring) {
      const lang = (infostring ?? "").trim().split(/\s+/)[0];
      const languageAttr = lang ? ` data-language="${escapeHtml(lang)}"` : "";
      return `<pre class="hljs"${languageAttr}><code>${highlightToHtml(code, lang)}</code></pre>`;
    },
    heading(text, depth, raw) {
      const id = slugify(raw, headingSlugCounts);
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
