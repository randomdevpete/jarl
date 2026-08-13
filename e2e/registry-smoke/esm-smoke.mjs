import assert from "node:assert/strict";
import * as atoms from "jarl-atoms";
import * as bindings from "jarl-react";

const EXPECTED_ATOMS = [
  "appendQueryParam",
  "createRootAtom",
  "followRedirects",
  "followResolvedRedirects",
  "isRedirect",
  "joinHref",
  "locationAtom",
  "normalizePathname",
  "paramRouteAtom",
  "parseQuery",
  "queryAtom",
  "queryParamAtom",
  "redirect",
  "redirectAtom",
  "resolvedAtom",
  "rootAtom",
  "routeAtom",
  "splitHref",
  "staticRouteAtom",
  "stringifyQuery",
  "transformRouteAtom",
];

const EXPECTED_BINDINGS = [
  "Link",
  "Route",
  "useAtom",
  "useAtomValue",
  "useHref",
  "useIsActive",
  "useLink",
  "useNavigate",
  "useRoute",
  "useSetAtom",
];

for (const name of EXPECTED_ATOMS) assert.ok(name in atoms, `jarl-atoms is missing ${name}`);
for (const name of EXPECTED_BINDINGS) assert.ok(name in bindings, `jarl-react is missing ${name}`);

// Route matching works with no DOM at all — jarl-atoms must not need `window`.
const { createStore } = await import("jotai/vanilla");
const store = createStore();
const products = atoms.staticRouteAtom("products");
const product = atoms.paramRouteAtom("productId", { parent: products });
store.set(atoms.locationAtom, { pathname: "/products/7", searchParams: new URLSearchParams() });
assert.equal(store.get(product).values?.productId, "7");
assert.equal(store.get(product).reverse({ productId: "9" }), "/products/9");

console.log("esm ok");
