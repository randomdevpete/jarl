/** Viking dark-theme tokens — the single source for every colour and font family on the docs site. */
export const theme = {
  bg: "#170f0a",
  bgAlt: "#241408",
  fg: "#ff6b52",
  fgMuted: "#c98a6e",
  accent: "#e8a33d",
  accentStrong: "#f4c065",
  border: "#4a2a16",
  codeBg: "#20130a",
  fontHeading: '"alverata", "Alverata", "Cinzel", Georgia, serif',
  fontBody:
    '"alegreya-sans", "Alegreya Sans", "Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontMono: '"input-mono", "Input Mono", "Source Code Pro", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  /** Code-block token colours (see `lib/highlight.ts`). `steel` contrasts types/built-ins from keywords. */
  syntax: {
    comment: "#8a6552",
    keyword: "#c2578f",
    string: "#7a9d5c",
    constant: "#e8a33d",
    entity: "#c98a6e",
    steel: "#8fb4c9",
    punctuation: "#c98a6e",
  },
} as const;
