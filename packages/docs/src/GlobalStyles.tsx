import { css, Global } from "@emotion/react";
import { theme } from "./theme";

const documentStyles = css`
  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
  }

  body {
    background: ${theme.bg};
    color: ${theme.fg};
    font-family: ${theme.fontBody};
    line-height: 1.6;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: ${theme.fontHeading};
    font-weight: 400;
    letter-spacing: 0.02em;
    color: ${theme.accent};
  }

  code,
  kbd,
  samp {
    font-family: ${theme.fontMono};
    /* input-mono runs visually larger than alegreya-sans at a shared em size, and its
       baseline sits slightly lower - scale down and nudge up so inline code reads level
       with the surrounding prose instead of looming over and under it. */
    font-size: 0.8em;
    line-height: 1;
    vertical-align: 0.05em;
    background: ${theme.codeBg};
    color: ${theme.accent};
    border-radius: 3px;
    padding: 0.15em 0.35em;
  }

  pre {
    font-family: ${theme.fontMono};
    font-size: 0.875em;
    line-height: 1.5;
    background: ${theme.codeBg};
    border: 1px solid ${theme.border};
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
  }

  pre code {
    font-size: 1em;
    line-height: inherit;
    vertical-align: baseline;
    background: none;
    padding: 0;
  }

  /* Syntax-highlighted code blocks, built by \`lib/highlight.ts\` (Markdown fences and demo
     view-source blocks alike) - see that file for the languages registered. */
  .hljs-comment,
  .hljs-quote {
    color: ${theme.syntax.comment};
    font-style: italic;
  }

  .hljs-keyword,
  .hljs-doctag,
  .hljs-meta {
    color: ${theme.syntax.keyword};
  }

  .hljs-string,
  .hljs-regexp,
  .hljs-template-tag,
  .hljs-meta .hljs-string {
    color: ${theme.syntax.string};
  }

  .hljs-number,
  .hljs-literal,
  .hljs-symbol,
  .hljs-bullet {
    color: ${theme.syntax.constant};
  }

  .hljs-title,
  .hljs-name,
  .hljs-section,
  .hljs-selector-tag {
    color: ${theme.syntax.entity};
  }

  /* Tiered scopes chain classes rather than dot them: \`title.class_\` emits
     \`hljs-title class_\`, so the selector below chains two classes too. */
  .hljs-type,
  .hljs-built_in,
  .hljs-title.class_,
  .hljs-selector-class,
  .hljs-selector-id,
  .hljs-template-variable {
    color: ${theme.syntax.steel};
  }

  .hljs-attr,
  .hljs-attribute,
  .hljs-property,
  .hljs-variable,
  .hljs-params {
    color: ${theme.syntax.constant};
  }

  .hljs-tag,
  .hljs-punctuation,
  .hljs-operator {
    color: ${theme.syntax.punctuation};
  }

  .hljs-emphasis {
    font-style: italic;
  }

  .hljs-strong {
    font-weight: 700;
  }

  a {
    color: ${theme.accent};
    text-decoration: none;
  }

  a:hover {
    color: ${theme.accentStrong};
    text-decoration: underline;
  }
`;

export const GlobalStyles = () => <Global styles={documentStyles} />;

export default GlobalStyles;
