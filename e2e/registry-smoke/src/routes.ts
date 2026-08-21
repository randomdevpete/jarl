import {
  asyncRouteAtom,
  paramRouteAtom,
  queryParamRouteAtom,
  redirectRouteAtom,
  rootRoute,
  staticRouteAtom,
} from "jarl-atoms";

export { rootRoute };

export const aboutRoute = staticRouteAtom("about");
export const productsRoute = staticRouteAtom("products");
export const productRoute = paramRouteAtom("productId", { parent: productsRoute });
export const searchQueryRoute = queryParamRouteAtom("q");

export const movedRoute = staticRouteAtom("moved");
export const movedRedirect = redirectRouteAtom("/about", { parent: movedRoute });

export const productData = asyncRouteAtom(productRoute, "product", async ({ productId }) => ({
  productId,
  title: `Product ${productId}`,
})).data;
