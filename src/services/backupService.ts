import type { FavoriteItem, IgnoreRange, Settings } from "../types.ts";
import { loadFavorites, saveFavorites } from "./favoritesStore.ts";
import { loadIgnoreRanges, saveIgnoreRanges } from "./ignoreRangeStore.ts";
import { loadSettings, saveSettings } from "./settingsStore.ts";
import { mergeRanges } from "../utils/rangeUtils.ts";

const BACKUP_VERSION = 1;
const BACKUP_KIND = "lgtmoon-wrapper/backup";

export type BackupPayload = {
  kind: typeof BACKUP_KIND;
  version: number;
  exportedAt: string;
  favorites: FavoriteItem[];
  ignoreRanges: IgnoreRange[];
  settings: Settings;
};

export type ImportMode = "merge" | "replace";

export type ImportResult = {
  favorites: { added: number; skipped: number };
  ignoreRanges: { added: number; total: number };
  settings: { applied: boolean };
};

export function buildBackup(): BackupPayload {
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    favorites: loadFavorites(),
    ignoreRanges: loadIgnoreRanges(),
    settings: loadSettings(),
  };
}

export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function parseBackup(json: string): BackupPayload {
  const raw = JSON.parse(json) as Partial<BackupPayload>;

  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid backup: not an object");
  }
  if (raw.kind !== BACKUP_KIND) {
    throw new Error(`Invalid backup: unexpected kind "${String(raw.kind)}"`);
  }
  if (typeof raw.version !== "number") {
    throw new Error("Invalid backup: missing version");
  }
  if (raw.version > BACKUP_VERSION) {
    throw new Error(
      `Backup version ${raw.version} is newer than supported (${BACKUP_VERSION})`,
    );
  }
  if (!Array.isArray(raw.favorites)) {
    throw new Error("Invalid backup: favorites must be an array");
  }
  if (!Array.isArray(raw.ignoreRanges)) {
    throw new Error("Invalid backup: ignoreRanges must be an array");
  }
  if (!raw.settings || typeof raw.settings !== "object") {
    throw new Error("Invalid backup: settings missing");
  }

  return {
    kind: BACKUP_KIND,
    version: raw.version,
    exportedAt: raw.exportedAt ?? "",
    favorites: raw.favorites,
    ignoreRanges: raw.ignoreRanges,
    settings: raw.settings,
  };
}

export function applyBackup(
  payload: BackupPayload,
  mode: ImportMode,
): ImportResult {
  const result: ImportResult = {
    favorites: { added: 0, skipped: 0 },
    ignoreRanges: { added: 0, total: 0 },
    settings: { applied: false },
  };

  if (mode === "replace") {
    saveFavorites(payload.favorites);
    result.favorites.added = payload.favorites.length;

    const normalized = mergeRanges(payload.ignoreRanges);
    saveIgnoreRanges(normalized);
    result.ignoreRanges.added = payload.ignoreRanges.length;
    result.ignoreRanges.total = normalized.length;

    saveSettings(payload.settings);
    result.settings.applied = true;
    return result;
  }

  const existingFavs = loadFavorites();
  const existingIds = new Set(existingFavs.map((f) => f.id));
  const newFavs: FavoriteItem[] = [];
  for (const fav of payload.favorites) {
    if (existingIds.has(fav.id)) {
      result.favorites.skipped++;
    } else {
      newFavs.push(fav);
      existingIds.add(fav.id);
      result.favorites.added++;
    }
  }
  if (newFavs.length > 0) {
    saveFavorites([...newFavs, ...existingFavs]);
  }

  const existingRanges = loadIgnoreRanges();
  const merged = mergeRanges([...existingRanges, ...payload.ignoreRanges]);
  saveIgnoreRanges(merged);
  result.ignoreRanges.added = payload.ignoreRanges.length;
  result.ignoreRanges.total = merged.length;

  return result;
}

export function backupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `lgtmoon-wrapper-backup-${stamp}.json`;
}
