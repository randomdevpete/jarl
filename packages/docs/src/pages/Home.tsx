import styled from "@emotion/styled";
import readme from "../../../../README.md?raw";
import Markdown from "../lib/Markdown";
import { VikingHelmetMark } from "../layout/VikingHelmetMark";
import { theme } from "../theme";

// Ported from the v1 demo site's About.js, which rendered the repo README at "/".
// Keeps a single source of truth for the intro copy instead of a duplicated page.
// The leading "# JARL" heading is rendered here instead, alongside the mark.
const readmeBody = readme.replace(/^# JARL\n+/, "");

const HomeHeading = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HomeMark = styled(VikingHelmetMark)`
  width: 3.2rem;
  height: 3.2rem;
  color: ${theme.accent};
`;

export const Home = () => (
  <>
    <HomeHeading>
      <HomeMark />
      JARL
    </HomeHeading>
    <Markdown source={readmeBody} />
  </>
);

export default Home;
