// Bundle-size entry: the react-router equivalent of jarl-entry.tsx (data
// router, NavLink, Outlet, params + programmatic navigation).
import { NavLink, Outlet, RouterProvider, createBrowserRouter, useNavigate, useParams } from "react-router";
import { createRoot } from "react-dom/client";

const Item = () => {
  const { itemId } = useParams<"itemId">();
  const navigate = useNavigate();
  return <button onClick={() => navigate("/about")}>{itemId ?? "none"}</button>;
};

const Layout = () => (
  <div>
    <NavLink to="/items/1">Item 1</NavLink>
    <Outlet />
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <h1>Home</h1> },
      { path: "about", element: <h1>About</h1> },
      { path: "items/:itemId", element: <Item /> },
      { path: "*", element: <h1>Not found</h1> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
