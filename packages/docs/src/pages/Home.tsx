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
const readmeBody = readme.replace(/^# .+\n+/, "");

const HomeHeading = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HomeMark = styled(VikingHelmetMark)`
  width: 3.2rem;
  height: 3.2rem;
  color: ${theme.accent};
  flex-shrink: 0;
`;

export const Home = () => (
  <>
    <HomeHeading>
      <HomeMark />
      <BrandName>Jarl: Atomic Routing Library</BrandName>
    </HomeHeading>
    <Markdown source={readmeBody} />
  </>
);

export default Home;
