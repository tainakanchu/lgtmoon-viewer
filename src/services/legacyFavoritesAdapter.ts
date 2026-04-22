import type { FavoriteItem, LegacyFavorite } from "../types.ts";
import { extractImageNumber } from "../utils/extractImageNumber.ts";
import { loadFavorites, saveFavorites } from "./favoritesStore.ts";

const IMPORT_META_KEY = "lgtmoon-wrapper/import-meta";

export function importLegacyFavorites(json: string): {
  imported: number;
  skipped: number;
  errors: number;
} {
  const result = { imported: 0, skipped: 0, errors: 0 };

  const legacy: LegacyFavorite[] = JSON.parse(json);
  if (!Array.isArray(legacy)) {
    throw new Error("Invalid format: expected a JSON array");
  }

  const existing = loadFavorites();
  const existingIds = new Set(existing.map((f) => f.id));
  const newItems: FavoriteItem[] = [];

  for (const item of legacy) {
    if (!item.url) {
      result.errors++;
      continue;
    }

    const imageNumber = extractImageNumber(item.url);
    if (imageNumber === null) {
      result.errors++;
      continue;
    }

    if (existingIds.has(item.url)) {
      result.skipped++;
      continue;
    }

    newItems.push({
      id: item.url,
      url: item.url,
      imageNumber,
      isConverted: item.isConverted ?? true,
      source: "imported",
      createdAt: new Date().toISOString(),
    });
    result.imported++;
  }

  if (newItems.length > 0) {
    saveFavorites([...existing, ...newItems]);
  }

  localStorage.setItem(
    IMPORT_META_KEY,
    JSON.stringify({
      importedAt: new Date().toISOString(),
      count: result.imported,
    }),
  );

  return result;
}
