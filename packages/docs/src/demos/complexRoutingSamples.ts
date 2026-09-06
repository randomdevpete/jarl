import { isValidCalendarDate } from "./blogPosts";

/** The three parts a `yyyy-mm-dd` path segment carries. */
export type DateSegment = { year: number; month: number; day: number };

/**
 * The `yyyy-mm-dd` spelling of a date. The route atom's `makePath`, the demo's own labels and the
 * prerender list below all go through this, so none of the three can drift from the others.
 */
export const formatDateSegment = ({ year, month, day }: DateSegment): string =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

// 2024 is a leap year, 2023 isn't - both are linked in the UI to show the calendar check rejecting
// one of them, and only the valid one is prerendered.
export const sampleDates: DateSegment[] = [
  { year: 2024, month: 2, day: 29 },
  { year: 2023, month: 2, day: 29 },
];

export const sampleFiles = [
  { name: "report", ext: "pdf", label: "A PDF report" },
  { name: "notes", ext: "txt", label: "A plain-text file" },
  { name: "archive.2024", ext: "zip", label: "A filename with a dot of its own" },
];

/** Every concrete path this demo's SSG build should prerender. */
export const complexRoutingStaticPaths = (): string[] => [
  "/demos/complex-routing",
  // Only the dates the route actually matches: the impossible one is there to be rejected live.
  ...sampleDates
    .filter(({ year, month, day }) => isValidCalendarDate(year, month, day))
    .map((date) => `/demos/complex-routing/archive/${formatDateSegment(date)}`),
  ...sampleFiles.map(({ name, ext }) => `/demos/complex-routing/files/${name}.${ext}`),
];
