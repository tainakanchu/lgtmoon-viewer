import type { Settings, IgnoreRange } from "../types.ts";
import { isIgnored } from "../utils/rangeUtils.ts";
import { buildImageUrl } from "./imageUrlBuilder.ts";
import { canLoadImage } from "./imageProbe.ts";

export type RandomImageResult = {
  url: string;
  imageNumber: number;
};

export async function getRandomImages(
  settings: Settings,
  ignoreRanges: IgnoreRange[],
  count: number,
): Promise<RandomImageResult[]> {
  const { minImageNumber, maxImageNumber, retryLimit } = settings;
  const range = maxImageNumber - minImageNumber + 1;

  const candidates: { url: string; imageNumber: number }[] = [];
  const seen = new Set<number>();
  let attempts = 0;

  while (candidates.length < count * 3 && attempts < retryLimit * count) {
    const n = Math.floor(Math.random() * range) + minImageNumber;
    attempts++;
    if (seen.has(n) || isIgnored(n, ignoreRanges)) continue;
    seen.add(n);
    candidates.push({ url: buildImageUrl(n), imageNumber: n });
  }

  const results = await Promise.all(
    candidates.map(async (c) => {
      const ok = await canLoadImage(c.url);
      return ok ? c : null;
    }),
  );

  const valid = results.filter((r): r is RandomImageResult => r !== null);

  if (valid.length === 0) {
    throw new Error(
      `Failed to find any valid image after ${attempts} attempts.`,
    );
  }

  return valid.slice(0, count);
}
