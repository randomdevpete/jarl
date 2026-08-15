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
  basicRoutingDemoPageRoute,
  blogRoutingDemoRoute,
  blogYearRoute,
  blogMonthRoute,
  blogDayRoute,
  blogPostRoute,
  asyncLookupDemoRoute,
  asyncLookupSlugRoute,
} from "./router/routes";
import Home from "./pages/Home";
import { DocsIndex, DocPage } from "./pages/Docs";
import { ApiIndex, ApiPage } from "./pages/Api";
import Changelog from "./pages/Changelog";
import History from "./pages/History";
import DemosIndex from "./pages/DemosIndex";
import BasicRoutingDemo from "./pages/BasicRoutingDemo";
import BlogRoutingDemo from "./pages/BlogRoutingDemo";
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
        <Route on={changelogRoute} exact>
          <Changelog />
        </Route>
        <Route on={historyRoute} exact>
          <History />
        </Route>
        <Route on={demosIndexRoute} exact>
          <DemosIndex />
        </Route>
        <Route on={basicRoutingDemoRoute} exact>
          <BasicRoutingDemo />
        </Route>
        <Route on={basicRoutingDemoPageRoute} exact>
          <BasicRoutingDemo />
        </Route>
        <Route on={blogRoutingDemoRoute} exact>
          <BlogRoutingDemo />
        </Route>
        <Route on={blogYearRoute} exact>
          <BlogRoutingDemo />
        </Route>
        <Route on={blogMonthRoute} exact>
          <BlogRoutingDemo />
        </Route>
        <Route on={blogDayRoute} exact>
          <BlogRoutingDemo />
        </Route>
        <Route on={blogPostRoute} exact>
          <BlogRoutingDemo />
        </Route>
        <Route on={asyncLookupDemoRoute} exact>
          <AsyncLookupDemo />
        </Route>
        {/* The slug route, not the async one: an unknown slug still renders the demo, showing
            its own not-found view, while `notFoundAtom` makes the response a real 404. */}
        <Route on={asyncLookupSlugRoute} exact>
          <AsyncLookupDemo />
        </Route>
      </Switch>
    </Layout>
  </>
);

export default App;
