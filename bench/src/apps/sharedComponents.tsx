// Shared verbatim by both apps, so any render-count difference comes from the router alone.
import { countRender } from "../renderCounter";
import { WIDGET_COUNT, itemIds } from "../shape";

/** Reads nothing from any router: the control group that should never re-render on navigation. */
export const Widget = ({ index }: { index: number }) => {
  countRender("widget");
  return <div className="widget">Widget {index}</div>;
};

export const Widgets = () => (
  <aside>
    {Array.from({ length: WIDGET_COUNT }, (_, i) => (
      <Widget key={i} index={i} />
    ))}
  </aside>
);

export const HomePage = () => {
  countRender("home page");
  return <h1>Home</h1>;
};

export const AboutPage = () => {
  countRender("about page");
  return <h1>About</h1>;
};

export const ItemsPage = () => {
  countRender("items page");
  return (
    <>
      <h1>Items</h1>
      <ul>
        {itemIds.map((id) => (
          <li key={id}>Item {id}</li>
        ))}
      </ul>
    </>
  );
};

export const ItemDetail = ({ itemId }: { itemId: string }) => {
  countRender("item page");
  return <h1>Item {itemId}</h1>;
};

export const NotFoundPage = () => <h1>Not found</h1>;
