import { highlightToHtml } from "./highlight";

/** A standalone syntax-highlighted code block, styled by the `.hljs` rules in `GlobalStyles`. */
export const CodeBlock = ({ code, lang }: { code: string; lang?: string }) => (
  <pre className="hljs" data-language={lang}>
    {/* eslint-disable-next-line react/no-danger */}
    <code dangerouslySetInnerHTML={{ __html: highlightToHtml(code, lang) }} />
  </pre>
);

export default CodeBlock;
