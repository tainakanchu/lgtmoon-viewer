import type { FavoriteItem } from "../types.ts";

const STORAGE_KEY = "lgtmoon-wrapper/favorites";

export function loadFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteItem[];
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: FavoriteItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function addFavorite(item: FavoriteItem): FavoriteItem[] {
  const current = loadFavorites();
  if (current.some((f) => f.id === item.id)) return current;
  const updated = [item, ...current];
  saveFavorites(updated);
  return updated;
}

export function removeFavorite(id: string): FavoriteItem[] {
  const current = loadFavorites();
  const updated = current.filter((f) => f.id !== id);
  saveFavorites(updated);
  return updated;
}
