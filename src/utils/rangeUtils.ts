import type { IgnoreRange } from "../types.ts";

export function isInRange(n: number, range: IgnoreRange): boolean {
  return range.enabled && n >= range.start && n <= range.end;
}

export function isIgnored(n: number, ranges: IgnoreRange[]): boolean {
  return ranges.some((r) => isInRange(n, r));
}

export function rangeSize(range: IgnoreRange): number {
  return range.end - range.start + 1;
}

function rangesOverlapOrAdjacent(a: IgnoreRange, b: IgnoreRange): boolean {
  return a.start <= b.end + 1 && b.start <= a.end + 1;
}

export function mergeRanges(ranges: IgnoreRange[]): IgnoreRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const result: IgnoreRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = result[result.length - 1];

    if (rangesOverlapOrAdjacent(last, current)) {
      const now = new Date().toISOString();
      result[result.length - 1] = {
        ...last,
        start: Math.min(last.start, current.start),
        end: Math.max(last.end, current.end),
        updatedAt: now,
      };
    } else {
      result.push(current);
    }
  }

  return result;
}

export function addRangeWithMerge(
  existing: IgnoreRange[],
  newStart: number,
  newEnd: number,
): IgnoreRange[] {
  const now = new Date().toISOString();
  const newRange: IgnoreRange = {
    id: crypto.randomUUID(),
    start: Math.min(newStart, newEnd),
    end: Math.max(newStart, newEnd),
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };

  return mergeRanges([...existing, newRange]);
}

export function splitRange(
  range: IgnoreRange,
  restoreStart: number,
  restoreEnd: number,
): IgnoreRange[] {
  const result: IgnoreRange[] = [];
  const now = new Date().toISOString();

  if (restoreStart > range.start) {
    result.push({
      ...range,
      id: crypto.randomUUID(),
      end: restoreStart - 1,
      updatedAt: now,
    });
  }

  if (restoreEnd < range.end) {
    result.push({
      ...range,
      id: crypto.randomUUID(),
      start: restoreEnd + 1,
      updatedAt: now,
    });
  }

  return result;
}
