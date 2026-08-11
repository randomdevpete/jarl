import { marked } from "marked";
import { useMemo } from "react";

marked.setOptions({ gfm: true });

/** Renders a markdown source string. Runs identically on server and client, so there's no hydration mismatch. */
export const Markdown = ({ source }: { source: string }) => {
  const html = useMemo(() => marked.parse(source, { async: false }) as string, [source]);
  // eslint-disable-next-line react/no-danger
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Markdown;
