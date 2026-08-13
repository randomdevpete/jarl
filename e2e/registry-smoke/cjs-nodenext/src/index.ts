// No "type": "module" above, so under node16 resolution this file compiles
// through the "require" condition — the case TS1479 broke.
import * as atoms from "jarl-atoms";
import * as bindings from "jarl-react";

const products = atoms.staticRouteAtom("products");
const product = atoms.paramRouteAtom("productId", { parent: products });

const LinkComponent: typeof bindings.Link = bindings.Link;

console.log(products, product, LinkComponent);
