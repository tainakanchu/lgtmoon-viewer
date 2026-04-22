import { useState, useEffect } from "react";
import { buildImageUrl } from "../services/imageUrlBuilder.ts";
import { canLoadImage } from "../services/imageProbe.ts";
import type { IgnoreRange } from "../types.ts";
import { isIgnored } from "../utils/rangeUtils.ts";

type NearbyExplorerProps = {
  anchor: number;
  windowSize?: number;
  ignoreRanges: IgnoreRange[];
  proposedStart?: number;
  proposedEnd?: number;
};

type ImageStatus = "loading" | "ok" | "error";

export function NearbyExplorer({
  anchor,
  windowSize = 10,
  ignoreRanges,
  proposedStart,
  proposedEnd,
}: NearbyExplorerProps) {
  const start = anchor - windowSize;
  const end = anchor + windowSize;
  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const [statuses, setStatuses] = useState<Record<number, ImageStatus>>({});

  useEffect(() => {
    setStatuses({});
    for (const n of numbers) {
      const url = buildImageUrl(n);
      canLoadImage(url).then((ok) => {
        setStatuses((prev) => ({ ...prev, [n]: ok ? "ok" : "error" }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, windowSize]);

  const getStatusClass = (n: number): string => {
    const ignored = isIgnored(n, ignoreRanges);
    const proposed =
      proposedStart !== undefined &&
      proposedEnd !== undefined &&
      n >= proposedStart &&
      n <= proposedEnd;

    if (proposed) return "nearby-proposed";
    if (ignored) return "nearby-ignored";
    return "nearby-normal";
  };

  return (
    <div className="nearby-explorer">
      <div className="nearby-grid">
        {numbers.map((n) => (
          <div key={n} className={`nearby-item ${getStatusClass(n)}`}>
            {statuses[n] === "ok" ? (
              <img
                src={buildImageUrl(n)}
                alt={`#${n}`}
                className="nearby-thumb"
              />
            ) : statuses[n] === "error" ? (
              <div className="nearby-placeholder">x</div>
            ) : (
              <div className="nearby-placeholder">...</div>
            )}
            <span className="nearby-number">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
