import type { IgnoreRange } from "../types.ts";
import { mergeRanges } from "../utils/rangeUtils.ts";

const STORAGE_KEY = "lgtmoon-wrapper/ignore-ranges";

export function loadIgnoreRanges(): IgnoreRange[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as IgnoreRange[];
  } catch {
    return [];
  }
}

export function saveIgnoreRanges(ranges: IgnoreRange[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ranges));
}

export function addIgnoreRange(start: number, end: number): IgnoreRange[] {
  const current = loadIgnoreRanges();
  const now = new Date().toISOString();
  const newRange: IgnoreRange = {
    id: crypto.randomUUID(),
    start: Math.min(start, end),
    end: Math.max(start, end),
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
  const merged = mergeRanges([...current, newRange]);
  saveIgnoreRanges(merged);
  return merged;
}

export function removeIgnoreRange(id: string): IgnoreRange[] {
  const current = loadIgnoreRanges();
  const updated = current.filter((r) => r.id !== id);
  saveIgnoreRanges(updated);
  return updated;
}

export function toggleIgnoreRange(id: string): IgnoreRange[] {
  const current = loadIgnoreRanges();
  const updated = current.map((r) =>
    r.id === id
      ? { ...r, enabled: !r.enabled, updatedAt: new Date().toISOString() }
      : r,
  );
  saveIgnoreRanges(updated);
  return updated;
}
