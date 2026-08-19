/** Summary of one timed measurement: quartiles over the retained (post-warm-up) samples. */
export type Summary = {
  samples: number;
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
};

const quantile = (sorted: number[], q: number): number => {
  const pos = (sorted.length - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower);
};

export const summarise = (samples: number[]): Summary => {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    samples: sorted.length,
    median: quantile(sorted, 0.5),
    p25: quantile(sorted, 0.25),
    p75: quantile(sorted, 0.75),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
};

/**
 * Times `warmup + samples` samples of `iterations` calls, discards the warm-up
 * ones, and summarises the rest in microseconds per call. Forces GC before each
 * sample where `--expose-gc` allows it.
 */
export const measure = (
  work: () => void,
  { samples = 30, warmup = 10, iterations = 1000 }: { samples?: number; warmup?: number; iterations?: number } = {},
): Summary => {
  const times: number[] = [];
  for (let s = 0; s < warmup + samples; s++) {
    globalThis.gc?.();
    const start = performance.now();
    for (let i = 0; i < iterations; i++) work();
    const elapsed = performance.now() - start;
    if (s >= warmup) times.push((elapsed * 1000) / iterations);
  }
  return summarise(times);
};

/** Async variant of `measure`, for workloads whose API is promise-based. */
export const measureAsync = async (
  work: () => Promise<void>,
  { samples = 30, warmup = 10, iterations = 1000 }: { samples?: number; warmup?: number; iterations?: number } = {},
): Promise<Summary> => {
  const times: number[] = [];
  for (let s = 0; s < warmup + samples; s++) {
    globalThis.gc?.();
    const start = performance.now();
    for (let i = 0; i < iterations; i++) await work();
    const elapsed = performance.now() - start;
    if (s >= warmup) times.push((elapsed * 1000) / iterations);
  }
  return summarise(times);
};

const fmt = (value: number) => (value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2));

export const formatSummary = ({ samples, median, p25, p75, min, max }: Summary, unit = "µs"): string =>
  `median ${fmt(median)}${unit}  p25 ${fmt(p25)}${unit}  p75 ${fmt(p75)}${unit}  min ${fmt(min)}${unit}  max ${fmt(max)}${unit}  (n=${samples})`;

/** Prints rows as a column-aligned table, first column left-justified. */
export const printTable = (title: string, header: string[], rows: (string | number)[][]) => {
  const all = [header, ...rows.map((row) => row.map(String))];
  const widths = header.map((_, col) => Math.max(...all.map((row) => row[col].length)));
  const line = (row: string[]) =>
    row.map((cell, col) => (col === 0 ? cell.padEnd(widths[col]) : cell.padStart(widths[col]))).join("  ");
  console.log(`\n${title}`);
  console.log(line(header));
  for (const row of all.slice(1)) console.log(line(row));
};
