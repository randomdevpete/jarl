import readme from "../../../../README.md?raw";
import Markdown from "../lib/Markdown";
import { VikingHelmetMark } from "../layout/VikingHelmetMark";

// Ported from the v1 demo site's About.js, which rendered the repo README at "/".
// Keeps a single source of truth for the intro copy instead of a duplicated page.
// The leading "# JARL" heading is rendered here instead, alongside the mark.
const readmeBody = readme.replace(/^# JARL\n+/, "");

export const Home = () => (
  <>
    <h1 className="home-heading">
      <VikingHelmetMark className="home-heading__mark" />
      JARL
    </h1>
    <Markdown source={readmeBody} />
  </>
);

export default Home;
