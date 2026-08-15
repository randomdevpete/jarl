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
    /* Mono x-height matches the body face at 0.875em */
    font-size: 0.875em;
    background: ${theme.codeBg};
    color: ${theme.accent};
    border-radius: 3px;
    padding: 0.1em 0.35em;
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
    background: none;
    padding: 0;
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
