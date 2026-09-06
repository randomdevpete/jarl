// The deep app shape: five nested levels, each a static segment plus a param
// (/d1/:p1/d2/:p2/…), so one URL exercises the full chain.

export const DEPTH = 5;

export const depths = Array.from({ length: DEPTH }, (_, i) => i + 1);

export type DeepParams = Record<string, string>;

type DeepOverrides = Partial<DeepParams>;

/** Params for one deep URL: every level at "x" except the overrides given. */
export const deepParams = (overrides: DeepOverrides = {}): DeepParams =>
  Object.fromEntries(depths.map((d) => [`p${d}`, overrides[`p${d}`] ?? "x"]));

export const deepPath = (overrides: DeepOverrides = {}): string => {
  const params = deepParams(overrides);
  return depths.map((d) => `/d${d}/${params[`p${d}`]}`).join("");
};

/** The six nav links: an A/B pair toggling one level's param at leaf, mid and root. */
export const deepLinks = [
  { label: "Leaf A", overrides: { p5: "a" } },
  { label: "Leaf B", overrides: { p5: "b" } },
  { label: "Mid A", overrides: { p3: "a" } },
  { label: "Mid B", overrides: { p3: "b" } },
  { label: "Root A", overrides: { p1: "a" } },
  { label: "Root B", overrides: { p1: "b" } },
].map(({ label, overrides }) => ({ label, href: deepPath(overrides), params: deepParams(overrides) }));
