import type { MigraineEntry, AppSettings, WeatherCache } from '../types';

const KEYS = {
  entries: 'prudentia_entries',
  settings: 'prudentia_settings',
  weather: 'prudentia_weather',
} as const;

// --- Migraine entries ---

export function getEntries(): MigraineEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.entries);
    return raw ? (JSON.parse(raw) as MigraineEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: MigraineEntry): void {
  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === entry.id);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }
  localStorage.setItem(KEYS.entries, JSON.stringify(entries));
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter(e => e.id !== id);
  localStorage.setItem(KEYS.entries, JSON.stringify(entries));
}

export function newEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Settings ---

export const DEFAULT_SETTINGS: AppSettings = {
  morningWindowStart: 4,
  morningWindowEnd: 5,
  eveningWindowStart: 20,
  eveningWindowEnd: 21,
  sensitivity: 'normal',
};

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
}

// --- Weather cache ---

export function getCachedWeather(): WeatherCache | null {
  try {
    const raw = localStorage.getItem(KEYS.weather);
    return raw ? (JSON.parse(raw) as WeatherCache) : null;
  } catch {
    return null;
  }
}

export function setCachedWeather(data: WeatherCache): void {
  localStorage.setItem(KEYS.weather, JSON.stringify(data));
}

// --- Export / import ---

export function exportData(): string {
  return JSON.stringify({ entries: getEntries(), settings: getSettings() }, null, 2);
}

export function importData(json: string): void {
  const parsed = JSON.parse(json) as { entries?: MigraineEntry[]; settings?: Partial<AppSettings> };
  if (Array.isArray(parsed.entries)) {
    localStorage.setItem(KEYS.entries, JSON.stringify(parsed.entries));
  }
  if (parsed.settings) {
    saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
  }
}
