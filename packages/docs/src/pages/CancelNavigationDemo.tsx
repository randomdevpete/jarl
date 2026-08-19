import { CancelNavigationApp } from "../demos/CancelNavigationApp";
import DemoPage from "../lib/DemoPage";
import demoSource from "../demos/CancelNavigationApp.tsx?raw";

export const CancelNavigationDemo = () => (
  <DemoPage
    title="Live demo: cancel navigation on dirty edits"
    sourcePath="packages/docs/src/demos/CancelNavigationApp.tsx"
    source={demoSource}
  >
    <CancelNavigationApp />
  </DemoPage>
);

export default CancelNavigationDemo;
