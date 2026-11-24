import type { Settings } from "../types.ts";
import { STORAGE_KEYS, getItem, setItem } from "./durableStorage.ts";

const STORAGE_KEY = STORAGE_KEYS.settings;

const DEFAULT_SETTINGS: Settings = {
  minImageNumber: 1,
  maxImageNumber: 700000,
  retryLimit: 50,
};

export function loadSettings(): Settings {
  try {
    const raw = getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getDefaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS };
}
