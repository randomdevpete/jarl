// Shared verbatim by all three deep apps, so any difference comes from the router alone.
import { ReactNode } from "react";
import { countRender } from "../../renderCounter";

/** Reads nothing from any router: should never re-render on navigation. */
const LevelStatic = ({ depth }: { depth: number }) => {
  countRender("per-level static");
  return <span className="static">static {depth}</span>;
};

export const Level = ({ depth, value, children }: { depth: number; value: string; children?: ReactNode }) => {
  countRender(`level ${depth} layout`);
  return (
    <div className="level">
      <h2>{`L${depth}:${value}`}</h2>
      <LevelStatic depth={depth} />
      {children}
    </div>
  );
};

export const DeepHome = () => {
  countRender("home page");
  return <h1>Home</h1>;
};

export const DeepNotFound = () => <h1>Not found</h1>;
