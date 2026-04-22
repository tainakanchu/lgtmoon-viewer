import { useState, useCallback, useEffect, useRef } from "react";
import { ImageCard } from "../components/ImageCard.tsx";
import { getRandomImages } from "../services/randomImageService.ts";
import type { RandomImageResult } from "../services/randomImageService.ts";
import { loadSettings } from "../services/settingsStore.ts";
import {
  loadIgnoreRanges,
  addIgnoreRange,
} from "../services/ignoreRangeStore.ts";
import { addFavorite } from "../services/favoritesStore.ts";
import { probeMax } from "../services/maxProbe.ts";
import type { ProbeResult } from "../services/maxProbe.ts";
import type { FavoriteItem } from "../types.ts";
import { isIgnored } from "../utils/rangeUtils.ts";

const BATCH_SIZE = 20;

type PendingIgnore = {
  imageNumber: number;
  start: number;
  end: number;
};

export function RandomPage() {
  const [images, setImages] = useState<RandomImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [pendingIgnores, setPendingIgnores] = useState<PendingIgnore[]>([]);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);

  const didAutoFetch = useRef(false);

  const pendingSet = new Set(pendingIgnores.map((p) => p.imageNumber));

  const fetchRandom = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFavoritedIds(new Set());
    setCopiedId(null);
    try {
      const settings = loadSettings();
      const ignoreRanges = loadIgnoreRanges();
      const results = await getRandomImages(settings, ignoreRanges, BATCH_SIZE);
      setImages(results);
      // probe max in background
      probeMax().then((r) => {
        if (r.expanded) setProbeResult(r);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!didAutoFetch.current) {
      didAutoFetch.current = true;
      fetchRandom();
    }
  }, [fetchRandom]);

  const handleFavorite = (img: RandomImageResult) => {
    const item: FavoriteItem = {
      id: img.url,
      url: img.url,
      imageNumber: img.imageNumber,
      isConverted: true,
      source: "wrapper",
      createdAt: new Date().toISOString(),
    };
    addFavorite(item);
    setFavoritedIds((prev) => new Set(prev).add(img.imageNumber));
  };

  const handleCopy = async (img: RandomImageResult) => {
    await navigator.clipboard.writeText(`![LGTM](${img.url})`);
    setCopiedId(img.imageNumber);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const addPendingIgnore = (n: number, delta: number) => {
    setPendingIgnores((prev) => {
      if (prev.some((p) => p.imageNumber === n)) return prev;
      return [...prev, { imageNumber: n, start: n - delta, end: n + delta }];
    });
  };

  const removePendingIgnore = (imageNumber: number) => {
    setPendingIgnores((prev) =>
      prev.filter((p) => p.imageNumber !== imageNumber),
    );
  };

  const commitIgnores = () => {
    let currentRanges = loadIgnoreRanges();
    for (const p of pendingIgnores) {
      currentRanges = addIgnoreRange(p.start, p.end);
    }
    setPendingIgnores([]);
    // remove images that now fall in committed ranges
    setImages((prev) =>
      prev.filter((img) => !isIgnored(img.imageNumber, currentRanges)),
    );
  };

  const clearPending = () => {
    setPendingIgnores([]);
  };

  return (
    <div className="page random-page">
      <h2>Random Images</h2>

      <div className="random-controls">
        <button
          className="btn btn-primary"
          onClick={fetchRandom}
          disabled={loading}
        >
          {loading ? "Loading..." : `Get ${BATCH_SIZE} Random Images`}
        </button>
      </div>

      {pendingIgnores.length > 0 && (
        <div className="pending-bar">
          <span className="pending-count">
            {pendingIgnores.length} pending ignore
            {pendingIgnores.length > 1 ? "s" : ""}
          </span>
          <div className="pending-tags">
            {pendingIgnores.map((p) => (
              <span key={p.imageNumber} className="pending-tag">
                {p.start === p.end
                  ? `#${p.imageNumber}`
                  : `#${p.imageNumber} (${p.start}–${p.end})`}
                <button
                  className="pending-tag-remove"
                  onClick={() => removePendingIgnore(p.imageNumber)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="pending-actions">
            <button className="btn btn-sm btn-primary" onClick={commitIgnores}>
              Commit All
            </button>
            <button className="btn btn-sm btn-secondary" onClick={clearPending}>
              Clear
            </button>
          </div>
        </div>
      )}

      {probeResult && probeResult.expanded && (
        <div className="probe-result">
          Max expanded: {probeResult.previousMax.toLocaleString()} →{" "}
          {probeResult.newMax.toLocaleString()}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {images.length > 0 && (
        <div className="image-grid">
          {images.map((img) => (
            <div
              key={img.imageNumber}
              className={`random-card-wrapper ${pendingSet.has(img.imageNumber) ? "pending-ignored" : ""}`}
            >
              <ImageCard
                url={img.url}
                imageNumber={img.imageNumber}
                showActions={false}
              />
              <div className="random-card-actions">
                <button
                  className="btn btn-sm"
                  onClick={() => handleCopy(img)}
                >
                  {copiedId === img.imageNumber ? "Copied!" : "Copy"}
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleFavorite(img)}
                  disabled={favoritedIds.has(img.imageNumber)}
                >
                  {favoritedIds.has(img.imageNumber) ? "Favorited" : "Fav"}
                </button>
                {pendingSet.has(img.imageNumber) ? (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => removePendingIgnore(img.imageNumber)}
                  >
                    Undo
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => addPendingIgnore(img.imageNumber, 0)}
                    >
                      Ignore
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => addPendingIgnore(img.imageNumber, 5)}
                    >
                      ±5
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => addPendingIgnore(img.imageNumber, 10)}
                    >
                      ±10
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
