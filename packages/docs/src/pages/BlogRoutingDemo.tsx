import { BlogRoutingApp } from "../demos/BlogRoutingApp";
import DemoPage from "../lib/DemoPage";
import demoSource from "../demos/BlogRoutingApp.tsx?raw";

export const BlogRoutingDemo = () => (
  <DemoPage title="Live demo: blog routing (atoms)" source={demoSource}>
    <BlogRoutingApp />
  </DemoPage>
);

export default BlogRoutingDemo;
