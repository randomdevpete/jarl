import {
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useHref,
  useLinkClickHandler,
  useMatch,
  useParams,
} from "react-router";
import { countRender } from "../renderCounter";
import { itemIds } from "../shape";
import { AboutPage, HomePage, ItemDetail, ItemsPage, NotFoundPage, Widgets } from "./sharedComponents";
import type { BenchApp } from "./types";

// Built on react-router's hook primitives (useMatch/useHref/useLinkClickHandler,
// the same ones NavLink is built from) so both apps render identical anchor
// markup; NavLink itself adds aria-current, which jarl's Link has no analogue of.
const NavItem = ({ href, label, exact }: { href: string; label: string; exact?: boolean }) => {
  countRender("nav link");
  const active = useMatch(exact ? href : `${href}/*`) != null;
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
    <NavItem href="/" label="Home" exact />
    <NavItem href="/about" label="About" exact />
    <NavItem href="/items" label="Items" />
    {itemIds.map((id) => (
      <NavItem key={id} href={`/items/${id}`} label={`Item ${id}`} exact />
    ))}
  </nav>
);

const Layout = () => {
  countRender("layout");
  return (
    <div>
      <Nav />
      <Widgets />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

const RoutedItemDetail = () => {
  const { itemId } = useParams<"itemId">();
  return <ItemDetail itemId={itemId!} />;
};

export const createReactRouterApp = (): BenchApp => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "about", element: <AboutPage /> },
        { path: "items", element: <ItemsPage /> },
        { path: "items/:itemId", element: <RoutedItemDetail /> },
        { path: "*", element: <NotFoundPage /> },
      ],
    },
  ]);
  return {
    element: <RouterProvider router={router} />,
    dispose: () => router.dispose(),
  };
};
