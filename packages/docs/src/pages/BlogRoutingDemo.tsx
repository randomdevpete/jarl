import { blogRoutingDemoRoute } from "../router/routes";
import { BlogRoutingApp } from "../demos/BlogRoutingApp";
import DemoPage from "../lib/DemoPage";
import demoSource from "../demos/BlogRoutingApp.tsx?raw";

export const BlogRoutingDemo = () => (
  <DemoPage title="Live demo: blog routing (atoms)" source={demoSource}>
    <BlogRoutingApp rootAtom={blogRoutingDemoRoute} />
  </DemoPage>
);

export default BlogRoutingDemo;
