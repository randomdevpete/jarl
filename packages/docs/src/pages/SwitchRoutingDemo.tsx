import { SwitchRoutingApp } from "../demos/SwitchRoutingApp";
import DemoPage from "../lib/DemoPage";
import demoSource from "../demos/SwitchRoutingApp.tsx?raw";

export const SwitchRoutingDemo = () => (
  <DemoPage
    title="Live demo: routing with a switch statement"
    sourcePath="packages/docs/src/demos/SwitchRoutingApp.tsx"
    source={demoSource}
  >
    <SwitchRoutingApp />
  </DemoPage>
);

export default SwitchRoutingDemo;
