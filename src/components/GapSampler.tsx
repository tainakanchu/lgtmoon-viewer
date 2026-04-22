import { useState, useEffect, useRef } from "react";
import { buildImageUrl } from "../services/imageUrlBuilder.ts";
import { canLoadImage } from "../services/imageProbe.ts";

type GapSamplerProps = {
  start: number;
  end: number;
  sampleSize?: number;
};

type SampleItem = {
  imageNumber: number;
  url: string;
  status: "loading" | "ok" | "error";
};

function pickSamples(start: number, end: number, count: number): number[] {
  const range = end - start + 1;
  if (range <= count) {
    return Array.from({ length: range }, (_, i) => start + i);
  }
  const seen = new Set<number>();
  while (seen.size < count) {
    seen.add(Math.floor(Math.random() * range) + start);
  }
  return [...seen].sort((a, b) => a - b);
}

function buildInitialSamples(
  start: number,
  end: number,
  sampleSize: number,
): SampleItem[] {
  return pickSamples(start, end, sampleSize * 3).map((n) => ({
    imageNumber: n,
    url: buildImageUrl(n),
    status: "loading" as const,
  }));
}

export function GapSampler({
  start,
  end,
  sampleSize = 20,
}: GapSamplerProps) {
  const [samples, setSamples] = useState<SampleItem[]>(() =>
    buildInitialSamples(start, end, sampleSize),
  );
  const versionRef = useRef(0);

  useEffect(() => {
    const version = versionRef.current;
    for (const item of samples) {
      if (item.status !== "loading") continue;
      canLoadImage(item.url).then((ok) => {
        if (versionRef.current !== version) return;
        setSamples((prev) =>
          prev.map((s) =>
            s.imageNumber === item.imageNumber
              ? { ...s, status: ok ? "ok" : "error" }
              : s,
          ),
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionRef.current]);

  const handleResample = () => {
    versionRef.current += 1;
    setSamples(buildInitialSamples(start, end, sampleSize));
  };

  const loaded = samples.filter((s) => s.status === "ok");
  const checking = samples.some((s) => s.status === "loading");

  return (
    <div className="gap-sampler">
      <div className="gap-sampler-header">
        <span className="gap-sampler-info">
          Sampling from {start}–{end} (
          {(end - start + 1).toLocaleString()} numbers)
        </span>
        <button className="btn btn-sm" onClick={handleResample}>
          Resample
        </button>
      </div>
      {checking && (
        <div className="gap-sampler-status">
          Loading... ({loaded.length} found so far)
        </div>
      )}
      {!checking && loaded.length === 0 && (
        <div className="gap-sampler-status">
          No valid images found in this range.
        </div>
      )}
      <div className="gap-sampler-grid">
        {loaded.slice(0, sampleSize).map((s) => (
          <div key={s.imageNumber} className="gap-sampler-item">
            <img src={s.url} alt={`#${s.imageNumber}`} loading="lazy" />
            <span className="gap-sampler-number">#{s.imageNumber}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
