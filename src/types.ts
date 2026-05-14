export type Trigger =
  | 'sleep'
  | 'stress'
  | 'caffeine'
  | 'hydration'
  | 'skipped_meal'
  | 'screen_time'
  | 'weather'
  | 'other';

export interface MigraineEntry {
  id: string;
  date: string;        // YYYY-MM-DD
  timeStarted: string; // HH:MM
  severity: number;    // 1–10
  duration: number;    // minutes
  notes: string;
  triggers: Trigger[];
}

export interface WeatherHourly {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
  surface_pressure: number[];
  wind_speed_10m: number[];
}

export interface WeatherCache {
  hourly: WeatherHourly;
  fetchedAt: number; // Unix ms timestamp
}

export type Sensitivity = 'low' | 'normal' | 'high';

export interface AppSettings {
  morningWindowStart: number; // 0–23
  morningWindowEnd: number;
  eveningWindowStart: number;
  eveningWindowEnd: number;
  sensitivity: Sensitivity;
}

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export interface WindowRisk {
  level: RiskLevel;
  score: number;
  reasons: string[];
}

export interface RiskAssessment {
  overall: RiskLevel;
  overallScore: number;
  morning: WindowRisk;
  evening: WindowRisk;
  topReasons: string[];
  weatherAvailable: boolean;
}
