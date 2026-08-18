const counts = new Map<string, number>();

export const countRender = (group: string) => {
  counts.set(group, (counts.get(group) ?? 0) + 1);
};

export const resetCounts = () => counts.clear();

export const snapshotCounts = (): ReadonlyMap<string, number> => new Map(counts);

/** Deltas since `before`, keeping zeroes: "did not re-render" is a result, not noise. */
export const diffCounts = (before: ReadonlyMap<string, number>): Map<string, number> => {
  const diff = new Map<string, number>();
  for (const [group, count] of counts) {
    diff.set(group, count - (before.get(group) ?? 0));
  }
  return diff;
};
