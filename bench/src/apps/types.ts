import type { ReactElement } from "react";

/** One mountable benchmark app; `dispose` tears down anything living outside the React tree. */
export type BenchApp = {
  element: ReactElement;
  dispose?: () => void;
};
