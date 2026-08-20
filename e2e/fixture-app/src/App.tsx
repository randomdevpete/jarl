import { useAtomValue } from "jotai";
import type { ComponentType } from "react";
import { rootAtom } from "./routes";
import Shell from "./pages/Shell";
import BasicRouting from "./pages/BasicRouting";
import AdvancedRouting from "./pages/AdvancedRouting";
import QueryStrings from "./pages/QueryStrings";
import Redirects from "./pages/Redirects";
import NavigationGuards from "./pages/NavigationGuards";

// Top-level segment -> demo. The v2 route atoms don't have a "first match
// wins" switch/exclusivity primitive yet, so this dispatch is done in plain
// component code (reading rootAtom directly) rather than by composing
// several independent <Route> elements, which would all render at once
// since nothing here excludes them from each other.
const DEMOS: Record<string, ComponentType> = {
  basicRouting: BasicRouting,
  advancedRouting: AdvancedRouting,
  queryStrings: QueryStrings,
  redirects: Redirects,
  navigationGuards: NavigationGuards,
};

const App = () => {
  const root = useAtomValue(rootAtom);
  const section = root.match ? root.rest.path[0] : undefined;
  const Demo = section && DEMOS[section];
  return Demo ? <Demo /> : <Shell />;
};

export default App;
