import styled from "@emotion/styled";
import { marked } from "marked";
import { useMemo } from "react";
import { theme } from "../theme";
import { escapeHtml, highlightToHtml } from "./highlight";

marked.setOptions({ gfm: true });
marked.use({
  renderer: {
    code(code, infostring) {
      const lang = (infostring ?? "").trim().split(/\s+/)[0];
      const languageAttr = lang ? ` data-language="${escapeHtml(lang)}"` : "";
      return `<pre class="hljs"${languageAttr}><code>${highlightToHtml(code, lang)}</code></pre>`;
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
  const html = useMemo(() => marked.parse(source, { async: false }) as string, [source]);
  // eslint-disable-next-line react/no-danger
  return <MarkdownBody dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Markdown;
