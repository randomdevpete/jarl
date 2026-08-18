import styled from "@emotion/styled";
import readme from "../../../../README.md?raw";
import Markdown from "../lib/Markdown";
import { VikingHelmetMark } from "../layout/VikingHelmetMark";
import { BrandName } from "../layout/Layout.styles";
import { theme } from "../theme";

// Ported from the v1 demo site's About.js, which rendered the repo README at "/".
// Keeps a single source of truth for the intro copy instead of a duplicated page.
// The README's own leading H1 is dropped since this page renders its own heading + mark instead
// (matched loosely so a future title edit in the README can't silently bring the H1 back).
// "atomic" in the tagline is wrapped in per-letter spans (.atomic-wave, styled in
// GlobalStyles.tsx) for the colour-wave animation - raw HTML since `marked` passes it
// straight through, same trick the README's own code blocks rely on.
const readmeBody = readme
  .replace(/^# .+\n+/, "")
  .replace(
    /\batomic\b/,
    [..."atomic"]
      .map((letter, i) => `<span class="atomic-wave" style="animation-delay: ${i * 0.15}s">${letter}</span>`)
      .join(""),
  );

const HomeHeading = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.15rem;
`;

const HomeMark = styled(VikingHelmetMark)`
  width: 3.2rem;
  height: 3.2rem;
  color: ${theme.accent};
  flex-shrink: 0;
`;

// Aligns the tagline's left edge under the small-caps "arl" of the "Jarl" wordmark -
// measured against the heading's rendered text at the default root font size.
const HomeIntro = styled.div`
  p:first-of-type {
    margin-top: 0;
    margin-bottom: 1.5rem;
    margin-left: 4.72rem;
  }
`;

export const Home = () => (
  <>
    <HomeHeading>
      <HomeMark />
      <BrandName>Jarl: Atomic Routing Library</BrandName>
    </HomeHeading>
    <HomeIntro>
      <Markdown source={readmeBody} />
    </HomeIntro>
  </>
);

export default Home;
