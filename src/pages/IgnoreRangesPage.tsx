import { useState } from "react";
import { GapSampler } from "../components/GapSampler.tsx";
import {
  loadIgnoreRanges,
  addIgnoreRange,
  removeIgnoreRange,
  toggleIgnoreRange,
} from "../services/ignoreRangeStore.ts";
import { buildImageUrl } from "../services/imageUrlBuilder.ts";
import { rangeSize } from "../utils/rangeUtils.ts";
import type { IgnoreRange } from "../types.ts";

type Gap = {
  start: number;
  end: number;
  size: number;
  leftRange: IgnoreRange;
  rightRange: IgnoreRange;
};

function computeGaps(ranges: IgnoreRange[]): Gap[] {
  const sorted = [...ranges]
    .filter((r) => r.enabled)
    .sort((a, b) => a.start - b.start);
  const gaps: Gap[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const left = sorted[i];
    const right = sorted[i + 1];
    const gapStart = left.end + 1;
    const gapEnd = right.start - 1;
    if (gapStart <= gapEnd) {
      gaps.push({
        start: gapStart,
        end: gapEnd,
        size: gapEnd - gapStart + 1,
        leftRange: left,
        rightRange: right,
      });
    }
  }
  return gaps;
}

export function IgnoreRangesPage() {
  const [ranges, setRanges] = useState<IgnoreRange[]>(loadIgnoreRanges);
  const [reviewingGap, setReviewingGap] = useState<Gap | null>(null);

  const gaps = computeGaps(ranges);

  const handleDelete = (id: string) => {
    setRanges(removeIgnoreRange(id));
  };

  const handleToggle = (id: string) => {
    setRanges(toggleIgnoreRange(id));
  };

  const handleBridgeGap = (gap: Gap) => {
    setRanges(addIgnoreRange(gap.start, gap.end));
    setReviewingGap(null);
  };

  return (
    <div className="page ignore-ranges-page">
      <h2>Ignore Ranges</h2>

      <section className="range-list-section">
        <h3>Current Ranges ({ranges.length})</h3>
        {ranges.length === 0 ? (
          <p className="empty-message">No ignore ranges defined.</p>
        ) : (
          <div className="range-list">
            {[...ranges]
              .filter((r) => r.enabled)
              .sort((a, b) => a.start - b.start)
              .map((range, i, sorted) => {
                const gap = gaps.find((g) => g.leftRange.id === range.id);
                const next = sorted[i + 1];
                return (
                  <div key={range.id}>
                    <div className="range-item">
                      <div className="range-thumbs">
                        <img
                          className="range-thumb"
                          src={buildImageUrl(range.start)}
                          alt={`#${range.start}`}
                        />
                        <img
                          className="range-thumb"
                          src={buildImageUrl(range.end)}
                          alt={`#${range.end}`}
                        />
                      </div>
                      <div className="range-info">
                        <strong>
                          {range.start}–{range.end}
                        </strong>
                        <span className="range-size">
                          {rangeSize(range).toLocaleString()} numbers
                        </span>
                        {range.label && (
                          <span className="range-label">{range.label}</span>
                        )}
                      </div>
                      <div className="range-actions">
                        <button
                          className="btn btn-sm"
                          onClick={() => handleToggle(range.id)}
                        >
                          Disable
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(range.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {gap && next && (
                      <div className="gap-item">
                        <div className="gap-info">
                          <span className="gap-label">
                            Gap: {gap.start}–{gap.end}
                          </span>
                          <span className="gap-size">
                            {gap.size.toLocaleString()} numbers
                          </span>
                        </div>
                        <div className="gap-actions">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleBridgeGap(gap)}
                          >
                            Bridge
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setReviewingGap(gap)}
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {ranges
              .filter((r) => !r.enabled)
              .map((range) => (
                <div key={range.id} className="range-item disabled">
                  <div className="range-info">
                    <strong>
                      {range.start}–{range.end}
                    </strong>
                    <span className="range-size">
                      {rangeSize(range).toLocaleString()} numbers
                    </span>
                  </div>
                  <div className="range-actions">
                    <button
                      className="btn btn-sm"
                      onClick={() => handleToggle(range.id)}
                    >
                      Enable
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(range.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {reviewingGap && (
        <div className="modal-overlay" onClick={() => setReviewingGap(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Review Gap: {reviewingGap.start}–{reviewingGap.end}
              </h3>
              <button
                className="modal-close"
                onClick={() => setReviewingGap(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <GapSampler
                key={`${reviewingGap.start}-${reviewingGap.end}`}
                start={reviewingGap.start}
                end={reviewingGap.end}
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => handleBridgeGap(reviewingGap)}
              >
                Bridge this gap
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setReviewingGap(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
