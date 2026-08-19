import GlobalStyles from "./GlobalStyles";
import Layout from "./layout/Layout";
import { Route, Switch } from "jarl-react";
import {
  homeRoute,
  docsSectionRoute,
  docPageRoute,
  apiSectionRoute,
  apiPageRoute,
  changelogRoute,
  historyRoute,
  demosIndexRoute,
  basicRoutingDemoRoute,
  blogRoutingDemoRoute,
  dataGridDemoRoute,
  cancelNavigationDemoRoute,
  complexRoutingDemoRoute,
  asyncLookupDemoRoute,
} from "./router/routes";
import Home from "./pages/Home";
import { DocsIndex, DocPage } from "./pages/Docs";
import { ApiIndex, ApiPage } from "./pages/Api";
import Changelog from "./pages/Changelog";
import History from "./pages/History";
import DemosIndex from "./pages/DemosIndex";
import BasicRoutingDemo from "./pages/BasicRoutingDemo";
import BlogRoutingDemo from "./pages/BlogRoutingDemo";
import DataGridDemo from "./pages/DataGridDemo";
import CancelNavigationDemo from "./pages/CancelNavigationDemo";
import ComplexRoutingDemo from "./pages/ComplexRoutingDemo";
import AsyncLookupDemo from "./pages/AsyncLookupDemo";
import NotFound from "./pages/NotFound";

export const App = () => (
  <>
    <GlobalStyles />
    <Layout>
      <Switch fallback={<NotFound />}>
        <Route on={homeRoute} exact>
          <Home />
        </Route>
        <Route on={docsSectionRoute} exact>
          <DocsIndex />
        </Route>
        <Route on={docPageRoute} exact>
          {({ docName }) => <DocPage docName={docName} />}
        </Route>
        <Route on={apiSectionRoute} exact>
          <ApiIndex />
        </Route>
        <Route on={apiPageRoute} exact>
          {({ apiName }) => <ApiPage apiName={apiName} />}
        </Route>
        <Route on={historyRoute} exact>
          <History />
        </Route>
        <Route on={demosIndexRoute} exact>
          <DemosIndex />
        </Route>
        {/* Changelog and the demos below are self-contained apps: one static mount each,
            matched non-exact, with everything under it routed inside the component. */}
        <Route on={changelogRoute}>
          <Changelog />
        </Route>
        <Route on={basicRoutingDemoRoute}>
          <BasicRoutingDemo />
        </Route>
        <Route on={blogRoutingDemoRoute}>
          <BlogRoutingDemo />
        </Route>
        <Route on={dataGridDemoRoute}>
          <DataGridDemo />
        </Route>
        <Route on={cancelNavigationDemoRoute}>
          <CancelNavigationDemo />
        </Route>
        <Route on={complexRoutingDemoRoute}>
          <ComplexRoutingDemo />
        </Route>
        <Route on={asyncLookupDemoRoute}>
          <AsyncLookupDemo />
        </Route>
      </Switch>
    </Layout>
  </>
);

export default App;
