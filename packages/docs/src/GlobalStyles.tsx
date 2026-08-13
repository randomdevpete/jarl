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
