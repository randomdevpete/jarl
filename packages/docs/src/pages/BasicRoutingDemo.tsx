import { BasicRoutingApp } from "../demos/BasicRoutingApp";
import DemoPage from "../lib/DemoPage";
import demoSource from "../demos/BasicRoutingApp.tsx?raw";

export const BasicRoutingDemo = () => (
  <DemoPage
    title="Live demo: basic routing (atoms)"
    sourcePath="packages/docs/src/demos/BasicRoutingApp.tsx"
    source={demoSource}
  >
    <BasicRoutingApp />
  </DemoPage>
);

export default BasicRoutingDemo;
