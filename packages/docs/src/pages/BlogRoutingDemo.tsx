import { BlogRoutingApp } from "../demos/BlogRoutingApp";
import DemoPage from "../lib/DemoPage";
import demoSource from "../demos/BlogRoutingApp.tsx?raw";

export const BlogRoutingDemo = () => (
  <DemoPage
    title="Live demo: blog routing (atoms)"
    sourcePath="packages/docs/src/demos/BlogRoutingApp.tsx"
    source={demoSource}
  >
    <BlogRoutingApp />
  </DemoPage>
);

export default BlogRoutingDemo;
