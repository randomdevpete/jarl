const assert = require("node:assert/strict");
const atoms = require("jarl-atoms");
const bindings = require("jarl-react");

assert.equal(typeof atoms.staticRouteAtom, "function");
assert.equal(typeof atoms.redirectRouteAtom, "function");
assert.equal(typeof bindings.Link, "function");
assert.equal(typeof bindings.Route, "function");
assert.equal(typeof bindings.useNavigate, "function");

const { createStore } = require("jotai/vanilla");
const store = createStore();
const products = atoms.staticRouteAtom("products");
const product = atoms.paramRouteAtom("productId", { parent: products });
store.set(atoms.locationAtom, { pathname: "/products/7", searchParams: new URLSearchParams() });
assert.equal(store.get(product).values.productId, "7");
assert.equal(store.get(product).reverse({ productId: "9" }), "/products/9");

console.log("cjs ok");
