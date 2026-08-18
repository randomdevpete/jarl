import { dataGridDemoRoute } from "../router/routes";
import { DataGridApp } from "../demos/DataGridApp";
import DemoPage from "../lib/DemoPage";
import demoSource from "../demos/DataGridApp.tsx?raw";

export const DataGridDemo = () => (
  <DemoPage
    title="Live demo: data grid filter/sort (query params)"
    sourcePath="packages/docs/src/demos/DataGridApp.tsx"
    source={demoSource}
  >
    <DataGridApp rootAtom={dataGridDemoRoute} />
  </DemoPage>
);

export default DataGridDemo;
