import { buildImageUrl } from "./imageUrlBuilder.ts";
import { canLoadImage } from "./imageProbe.ts";
import { loadSettings, saveSettings } from "./settingsStore.ts";

const PROBE_STEPS = [1, 5, 10, 50, 100, 500, 1000];
const PROBE_COUNT = 10;

export type ProbeResult = {
  previousMax: number;
  newMax: number;
  expanded: boolean;
};

export async function probeMax(): Promise<ProbeResult> {
  const settings = loadSettings();
  const previousMax = settings.maxImageNumber;

  const probes: number[] = [];
  for (const step of PROBE_STEPS) {
    for (let i = 1; i <= PROBE_COUNT; i++) {
      probes.push(previousMax + step * i);
    }
  }

  const unique = [...new Set(probes)].sort((a, b) => a - b);

  const results = await Promise.all(
    unique.map(async (n) => {
      const ok = await canLoadImage(buildImageUrl(n));
      return { n, ok };
    }),
  );

  const found = results.filter((r) => r.ok).map((r) => r.n);

  if (found.length === 0) {
    return { previousMax, newMax: previousMax, expanded: false };
  }

  const newMax = Math.max(...found);
  settings.maxImageNumber = newMax;
  saveSettings(settings);

  return { previousMax, newMax, expanded: true };
}
