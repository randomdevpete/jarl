import { AsyncLookupApp } from "../demos/AsyncLookupApp";
import DemoPage from "../lib/DemoPage";
import demoSource from "../demos/AsyncLookupApp.tsx?raw";

export const AsyncLookupDemo = () => (
  <DemoPage title="Live demo: async lookup (SSR 404s)" source={demoSource}>
    <AsyncLookupApp />
  </DemoPage>
);

export default AsyncLookupDemo;
