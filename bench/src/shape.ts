// The one app shape both routers implement, so every measurement compares the
// same UI: a layout with an active-styled nav, non-routing widgets, and four
// routed pages (home, about, items list, item detail).

export const ITEM_COUNT = 10;
export const WIDGET_COUNT = 10;

export const itemIds = Array.from({ length: ITEM_COUNT }, (_, i) => String(i + 1));

export type NavEntry = { label: string; href: string; exact: boolean };

export const navEntries: NavEntry[] = [
  { label: "Home", href: "/", exact: true },
  { label: "About", href: "/about", exact: true },
  { label: "Items", href: "/items", exact: false },
  ...itemIds.map((id) => ({ label: `Item ${id}`, href: `/items/${id}`, exact: true })),
];
