/** Every page this demo has: the switch's cases, and the only segments its page route matches. */
export const switchRoutingPages = ["home", "about", "contact"] as const;

export type SwitchRoutingPage = (typeof switchRoutingPages)[number];

export const isSwitchRoutingPage = (segment: string): segment is SwitchRoutingPage =>
  (switchRoutingPages as readonly string[]).includes(segment);

export const switchRoutingPageLabels: Record<SwitchRoutingPage, string> = {
  home: "Home",
  about: "About",
  contact: "Contact",
};

/** Every concrete path this demo's SSG build should prerender. */
export const switchRoutingStaticPaths = (): string[] => [
  "/demos/switch-routing",
  ...switchRoutingPages.map((page) => `/demos/switch-routing/${page}`),
];
