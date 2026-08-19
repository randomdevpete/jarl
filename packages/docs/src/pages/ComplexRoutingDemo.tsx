import { complexRoutingDemoRoute } from "../router/routes";
import { ComplexRoutingApp } from "../demos/ComplexRoutingApp";
import DemoPage from "../lib/DemoPage";
import demoSource from "../demos/ComplexRoutingApp.tsx?raw";

export const ComplexRoutingDemo = () => (
  <DemoPage
    title="Live demo: complex routing (custom path segments)"
    sourcePath="packages/docs/src/demos/ComplexRoutingApp.tsx"
    source={demoSource}
  >
    <ComplexRoutingApp rootAtom={complexRoutingDemoRoute} />
  </DemoPage>
);

export default ComplexRoutingDemo;
