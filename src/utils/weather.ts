import type { WeatherCache, WeatherHourly } from '../types';
import { getCachedWeather, setCachedWeather } from './storage';

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=43.3700&longitude=-80.9822' +
  '&hourly=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m' +
  '&timezone=America%2FToronto';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function fetchWeather(): Promise<WeatherHourly> {
  const cached = getCachedWeather();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.hourly;
  }

  const res = await fetch(WEATHER_URL);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);

  const json = (await res.json()) as { hourly: WeatherHourly };
  const cache: WeatherCache = { hourly: json.hourly, fetchedAt: Date.now() };
  setCachedWeather(cache);
  return json.hourly;
}

// Returns the index in the hourly arrays closest to the given Date
export function hourIndexForDate(hourly: WeatherHourly, date: Date): number {
  const ts = date.getTime();
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < hourly.time.length; i++) {
    const diff = Math.abs(new Date(hourly.time[i]).getTime() - ts);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return best;
}

// Returns a slice of weather data centred on a target hour for the next N hours
export function getWeatherSlice(hourly: WeatherHourly, fromDate: Date, hours: number) {
  const start = hourIndexForDate(hourly, fromDate);
  const end = Math.min(start + hours, hourly.time.length);
  return {
    time: hourly.time.slice(start, end),
    temperature_2m: hourly.temperature_2m.slice(start, end),
    relative_humidity_2m: hourly.relative_humidity_2m.slice(start, end),
    precipitation: hourly.precipitation.slice(start, end),
    surface_pressure: hourly.surface_pressure.slice(start, end),
    wind_speed_10m: hourly.wind_speed_10m.slice(start, end),
  };
}

// Pressure trend over the last 24 hours: positive = rising, negative = falling
export function pressureTrend(hourly: WeatherHourly, nowIndex: number): number {
  const past = Math.max(0, nowIndex - 24);
  return hourly.surface_pressure[nowIndex] - hourly.surface_pressure[past];
}
