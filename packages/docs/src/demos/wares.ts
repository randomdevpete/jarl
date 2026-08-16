/** A single row of the data grid demo's trading-post inventory. */
export type Ware = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

/** Fixed inventory - enough rows to see filtering/sorting do something, not a stand-in for a
 * real dataset. */
export const wares: Ware[] = [
  { id: "w1", name: "Iron Axe", category: "Weapons", price: 24, stock: 6 },
  { id: "w2", name: "Round Shield", category: "Weapons", price: 32, stock: 3 },
  { id: "w3", name: "Seax Knife", category: "Weapons", price: 14, stock: 11 },
  { id: "w4", name: "Whetstone", category: "Tools", price: 3, stock: 40 },
  { id: "w5", name: "Iron Nails (bag)", category: "Tools", price: 5, stock: 25 },
  { id: "w6", name: "Adze", category: "Tools", price: 18, stock: 7 },
  { id: "w7", name: "Wool Cloak", category: "Textiles", price: 21, stock: 9 },
  { id: "w8", name: "Linen Tunic", category: "Textiles", price: 12, stock: 15 },
  { id: "w9", name: "Sailcloth (bolt)", category: "Textiles", price: 45, stock: 4 },
  { id: "w10", name: "Salted Herring (barrel)", category: "Provisions", price: 9, stock: 20 },
  { id: "w11", name: "Rye Bread", category: "Provisions", price: 2, stock: 30 },
  { id: "w12", name: "Mead (cask)", category: "Provisions", price: 16, stock: 12 },
  { id: "w13", name: "Amber Pendant", category: "Ornaments", price: 38, stock: 5 },
  { id: "w14", name: "Silver Arm-ring", category: "Ornaments", price: 60, stock: 2 },
];

export type SortKey = "name" | "category" | "price" | "stock";
export type SortDirection = "asc" | "desc";

export const sortColumns: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price (silver)" },
  { key: "stock", label: "Stock" },
];

const sortKeys = sortColumns.map((column) => column.key);

/** Parses a `sort` query value like "-price" into a column key and direction; falls back to
 * name/ascending for anything missing or unrecognised. */
export const parseSort = (sort: string | undefined): { key: SortKey; direction: SortDirection } => {
  const fallback: { key: SortKey; direction: SortDirection } = { key: "name", direction: "asc" };
  if (!sort) return fallback;
  const direction: SortDirection = sort.startsWith("-") ? "desc" : "asc";
  const key = direction === "desc" ? sort.slice(1) : sort;
  return sortKeys.includes(key as SortKey) ? { key: key as SortKey, direction } : fallback;
};

/** Inverse of parseSort. */
export const stringifySort = (key: SortKey, direction: SortDirection): string =>
  direction === "desc" ? `-${key}` : key;

export const filterWares = (rows: Ware[], filter: string | undefined): Ware[] => {
  if (!filter) return rows;
  const needle = filter.toLowerCase();
  return rows.filter(
    (ware) => ware.name.toLowerCase().includes(needle) || ware.category.toLowerCase().includes(needle),
  );
};

export const sortWares = (rows: Ware[], key: SortKey, direction: SortDirection): Ware[] => {
  const sorted = [...rows].sort((a, b) =>
    typeof a[key] === "number" ? (a[key] as number) - (b[key] as number) : String(a[key]).localeCompare(String(b[key])),
  );
  return direction === "desc" ? sorted.reverse() : sorted;
};
