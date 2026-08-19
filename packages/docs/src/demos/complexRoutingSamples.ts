// 2024 is a leap year, 2023 isn't - both shown in the UI to demonstrate validation, but only the valid one prerendered.
export const sampleDates = ["2024-02-29", "2023-02-29"];

export const sampleFiles = [
  { name: "report", ext: "pdf", label: "A PDF report" },
  { name: "notes", ext: "txt", label: "A plain-text file" },
  { name: "archive.2024", ext: "zip", label: "A filename with a dot of its own" },
];

/** Every concrete path this demo's SSG build should prerender. */
export const complexRoutingStaticPaths = (): string[] => [
  "/demos/complex-routing",
  // Only prerender the valid leap-year date; the invalid one demonstrates validateAtom's rejection in the live demo.
  "/demos/complex-routing/archive/2024-02-29",
  ...sampleFiles.map(({ name, ext }) => `/demos/complex-routing/files/${name}.${ext}`),
];
