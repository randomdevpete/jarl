import { useAtomValue } from "jotai";
import Layout from "./layout/Layout";
import { Route } from "jarl-react";
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
    notFoundAtom,
} from "./router/routes";
import Home from "./pages/Home";
import { DocsIndex, DocPage } from "./pages/Docs";
import { ApiIndex, ApiPage } from "./pages/Api";
import Changelog from "./pages/Changelog";
import History from "./pages/History";
import DemosIndex from "./pages/DemosIndex";
import BasicRoutingDemo from "./pages/BasicRoutingDemo";
import NotFound from "./pages/NotFound";

export const App = () => {
    const notFound = useAtomValue(notFoundAtom);
    return (
        <Layout>
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
            {notFound && <NotFound />}
        </Layout>
    );
};

export default App;
