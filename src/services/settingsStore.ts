import type { Settings } from "../types.ts";

const STORAGE_KEY = "lgtmoon-wrapper/settings";

const DEFAULT_SETTINGS: Settings = {
  minImageNumber: 1,
  maxImageNumber: 700000,
  retryLimit: 50,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getDefaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS };
}
