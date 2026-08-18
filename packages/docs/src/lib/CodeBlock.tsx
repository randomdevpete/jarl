import { highlightToHtml } from "./highlight";

/**
 * A standalone syntax-highlighted code block, styled by the `.hljs` rules in `GlobalStyles`.
 * `sourcePath` is the repo path of the file `code` came from - when given, its own relative
 * imports are linked to that file on GitHub (see `highlightToHtml`).
 */
export const CodeBlock = ({ code, lang, sourcePath }: { code: string; lang?: string; sourcePath?: string }) => (
  <pre className="hljs" data-language={lang}>
    {/* eslint-disable-next-line react/no-danger */}
    <code dangerouslySetInnerHTML={{ __html: highlightToHtml(code, lang, sourcePath) }} />
  </pre>
);

export default CodeBlock;
