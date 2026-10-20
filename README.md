# Prudentia – Migraine Prediction

A small, private, browser-only web app for tracking migraines and estimating today's migraine risk from your own history and the local weather in Stratford, Ontario.

Built with React 18, TypeScript and Vite. There is no backend: all data stays in your browser's `localStorage`.

## Features

The app has five tabs:

- **Home (Dashboard):** shows an overall risk level (Low / Moderate / High) plus a separate risk for your morning and evening "risk windows", with the main reasons behind each score.
- **Log:** record a migraine with date, start time, severity (1–10), duration, notes and suspected triggers (sleep, stress, caffeine, hydration, skipped meal, screen time, weather, other).
- **History:** lists past entries, which you can edit or delete.
- **Weather:** hourly trends for pressure, temperature, humidity, precipitation and wind.
- **Settings:** set the morning/evening risk-window hours (defaults are 04:00–05:00 and 20:00–21:00), pick a risk sensitivity (low / normal / high), and export or import all data as JSON.

## How the risk estimate works

`src/utils/prediction.ts` adds up a heuristic score from:

- whether you are in, or approaching, one of your risk windows
- how often you have logged migraines recently
- the time of day your past migraines usually started
- personalised trigger weights, once you have 30 or more logs
- weather: falling or low barometric pressure, high humidity, precipitation, large temperature swings and strong wind

The score is mapped to Low / Moderate / High, adjusted by your sensitivity setting. It is a simple rule-based estimate, **not medical advice**.

## Weather data

Hourly forecasts come from the free [Open-Meteo](https://open-meteo.com/) API (no API key needed). The location is hardcoded to Stratford, ON (lat 43.37, lon −80.98) in `src/utils/weather.ts`. Responses are cached in `localStorage` for one hour. If the weather request fails, the app still works using your history alone.

## Getting started

Requires Node.js 18 or later.

```bash
npm install
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # type-check and build to dist/
npm run preview   # serve the production build locally
```

## Data & privacy

Entries, settings and the weather cache are stored only in your browser's `localStorage` (keys `prudentia_entries`, `prudentia_settings`, `prudentia_weather`). Clearing site data deletes them, so use **Settings → Export** to keep a backup.

## Project layout

```
src/
  App.tsx              tab navigation
  components/          Dashboard, LogMigraine, History, WeatherTrends, Settings, SimpleChart
  utils/prediction.ts  risk scoring
  utils/weather.ts     Open-Meteo fetch + caching helpers
  utils/storage.ts     localStorage persistence, export/import
  types.ts             shared types
```
