// Both react-router forms of the deep app: the data router (route config,
// branches ranked once at creation) and the declarative <Routes> form (route
// tree rebuilt from JSX children on every render).
import { ReactNode } from "react";
import {
  BrowserRouter,
  Outlet,
  Route,
  RouterProvider,
  Routes,
  createBrowserRouter,
  useHref,
  useLinkClickHandler,
  useMatch,
  useParams,
} from "react-router";
import { countRender } from "../../renderCounter";
import { deepLinks, depths } from "../../shapeDeep";
import type { BenchApp } from "../types";
import { DeepHome, DeepNotFound, Level } from "./sharedDeepComponents";

const NavItem = ({ href, label }: { href: string; label: string }) => {
  countRender("nav link");
  const active = useMatch(href) != null;
  const linkHref = useHref(href);
  const onClick = useLinkClickHandler(href);
  return (
    <a href={linkHref} className={active ? "active" : undefined} onClick={onClick}>
      {label}
    </a>
  );
};

const Nav = () => (
  <nav>
    {deepLinks.map(({ label, href }) => (
      <NavItem key={label} href={href} label={label} />
    ))}
  </nav>
);

const Shell = () => {
  countRender("shell");
  return (
    <div>
      <Nav />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

const RoutedLevel = ({ depth }: { depth: number }) => {
  const params = useParams();
  return (
    <Level depth={depth} value={params[`p${depth}`]!}>
      <Outlet />
    </Level>
  );
};

// Innermost first, mirroring the jarl app's nesting.
const routeConfig = [
  {
    path: "/",
    element: <Shell />,
    children: [
      { index: true, element: <DeepHome /> },
      depths.reduceRight(
        (child, depth) => ({
          path: `d${depth}/:p${depth}`,
          element: <RoutedLevel depth={depth} />,
          children: child ? [child] : undefined,
        }),
        undefined as object | undefined,
      )!,
      { path: "*", element: <DeepNotFound /> },
    ],
  },
];

export const createReactRouterDeepApp = (): BenchApp => {
  const router = createBrowserRouter(routeConfig as Parameters<typeof createBrowserRouter>[0]);
  return {
    element: <RouterProvider router={router} />,
    dispose: () => router.dispose(),
  };
};

// The same routes as JSX <Route> elements under a plain <BrowserRouter>.
const declarativeNested = depths.reduceRight<ReactNode>(
  (child, depth) => (
    <Route path={`d${depth}/:p${depth}`} element={<RoutedLevel depth={depth} />}>
      {child}
    </Route>
  ),
  null,
);

export const createReactRouterDeclarativeDeepApp = (): BenchApp => ({
  element: (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<DeepHome />} />
          {declarativeNested}
          <Route path="*" element={<DeepNotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  ),
});
