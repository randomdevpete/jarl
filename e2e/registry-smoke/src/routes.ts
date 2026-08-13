import { paramRouteAtom, queryParamAtom, redirectAtom, resolvedAtom, rootAtom, staticRouteAtom } from "jarl-atoms";

export { rootAtom };

export const aboutRoute = staticRouteAtom("about");
export const productsRoute = staticRouteAtom("products");
export const productRoute = paramRouteAtom("productId", { parent: productsRoute });
export const searchQueryRoute = queryParamAtom("q");

export const movedRoute = staticRouteAtom("moved");
export const movedRedirect = redirectAtom("/about", { parent: movedRoute });

export const productData = resolvedAtom(productRoute, async ({ productId }) => ({
  productId,
  title: `Product ${productId}`,
}));
