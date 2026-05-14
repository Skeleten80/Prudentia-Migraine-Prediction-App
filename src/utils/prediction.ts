import type { MigraineEntry, AppSettings, WeatherHourly, RiskLevel, WindowRisk, RiskAssessment } from '../types';
import { hourIndexForDate, pressureTrend } from './weather';

function toLevel(score: number, sensitivity: AppSettings['sensitivity']): RiskLevel {
  const offset = sensitivity === 'low' ? 12 : sensitivity === 'high' ? -12 : 0;
  const s = score + offset;
  if (s >= 60) return 'High';
  if (s >= 32) return 'Moderate';
  return 'Low';
}

function scoreWindow(
  windowStart: number,
  windowEnd: number,
  hourly: WeatherHourly | null,
  entries: MigraineEntry[],
  settings: AppSettings,
  targetDate: Date,
): WindowRisk {
  const reasons: string[] = [];
  let score = 0;

  // --- Time window proximity ---
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const windowMid = (windowStart + windowEnd) / 2;
  const distHours = Math.abs(currentHour - windowMid);
  if (distHours <= 0.5) {
    score += 25;
    reasons.push(`Currently in risk window (${windowStart}–${windowEnd}h)`);
  } else if (distHours <= 2) {
    score += 10;
    reasons.push(`Approaching risk window (${windowStart}–${windowEnd}h)`);
  }

  // --- Recent migraine frequency ---
  const nowMs = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const recent24 = entries.filter(e => {
    const d = new Date(`${e.date}T${e.timeStarted}`).getTime();
    return nowMs - d < day;
  });
  const recent48 = entries.filter(e => {
    const d = new Date(`${e.date}T${e.timeStarted}`).getTime();
    return nowMs - d < 2 * day;
  });
  const recent7d = entries.filter(e => {
    const d = new Date(`${e.date}T${e.timeStarted}`).getTime();
    return nowMs - d < 7 * day;
  });

  if (recent24.length > 0) {
    score += 15;
    reasons.push('Migraine in the last 24 hours');
  } else if (recent48.length > 0) {
    score += 8;
    reasons.push('Migraine in the last 48 hours');
  }
  if (recent7d.length >= 3) {
    score += 15;
    reasons.push(`${recent7d.length} migraines this week`);
  }

  // --- Time-of-day pattern from history ---
  const sameTimeCount = entries.filter(e => {
    const h = parseInt(e.timeStarted.split(':')[0], 10);
    return h >= windowStart - 1 && h <= windowEnd + 1;
  }).length;
  if (entries.length >= 5 && sameTimeCount / entries.length > 0.3) {
    score += 12;
    reasons.push(`${Math.round((sameTimeCount / entries.length) * 100)}% of past migraines near this window`);
  }

  // --- Personalised trigger weights (30+ logs) ---
  if (entries.length >= 30) {
    const triggerCounts: Record<string, number> = {};
    entries.forEach(e => e.triggers.forEach(t => { triggerCounts[t] = (triggerCounts[t] ?? 0) + 1; }));
    const total = entries.length;
    const dominant = Object.entries(triggerCounts)
      .filter(([, c]) => c / total > 0.4)
      .map(([t]) => t);
    if (dominant.length > 0) {
      score += 8;
      reasons.push(`Personal trigger patterns: ${dominant.join(', ')}`);
    }
  }

  // --- Weather factors ---
  if (hourly) {
    const idx = hourIndexForDate(hourly, targetDate);
    const pressure = hourly.surface_pressure[idx];
    const humidity = hourly.relative_humidity_2m[idx];
    const precip = hourly.precipitation[idx];
    const wind = hourly.wind_speed_10m[idx];
    const tempNow = hourly.temperature_2m[idx];
    const tempPast = hourly.temperature_2m[Math.max(0, idx - 24)];
    const tempSwing = Math.abs(tempNow - tempPast);
    const trend = pressureTrend(hourly, idx);

    if (trend < -5) {
      score += 20;
      reasons.push(`Pressure dropping sharply (${trend.toFixed(1)} hPa)`);
    } else if (trend < -3) {
      score += 12;
      reasons.push(`Pressure falling (${trend.toFixed(1)} hPa)`);
    } else if (trend < -1) {
      score += 5;
      reasons.push(`Slight pressure drop (${trend.toFixed(1)} hPa)`);
    }

    if (pressure < 1005) {
      score += 8;
      reasons.push(`Low atmospheric pressure (${pressure.toFixed(0)} hPa)`);
    }

    if (humidity > 80) {
      score += 15;
      reasons.push(`High humidity (${humidity.toFixed(0)}%)`);
    } else if (humidity > 70) {
      score += 8;
      reasons.push(`Elevated humidity (${humidity.toFixed(0)}%)`);
    }

    if (precip > 0) {
      score += 5;
      reasons.push(`Precipitation (${precip.toFixed(1)} mm)`);
    }

    if (tempSwing > 8) {
      score += 10;
      reasons.push(`Large temperature swing (${tempSwing.toFixed(1)}°C)`);
    } else if (tempSwing > 5) {
      score += 5;
      reasons.push(`Moderate temperature change (${tempSwing.toFixed(1)}°C)`);
    }

    if (wind > 40) {
      score += 8;
      reasons.push(`High wind speed (${wind.toFixed(0)} km/h)`);
    } else if (wind > 25) {
      score += 4;
      reasons.push(`Gusty winds (${wind.toFixed(0)} km/h)`);
    }
  }

  const level = toLevel(score, settings.sensitivity);
  return { level, score, reasons: reasons.slice(0, 5) };
}

export function assessRisk(
  entries: MigraineEntry[],
  settings: AppSettings,
  hourly: WeatherHourly | null,
): RiskAssessment {
  const now = new Date();

  // Target the midpoints of each window for weather lookup
  const morningTarget = new Date(now);
  morningTarget.setHours(settings.morningWindowStart, 30, 0, 0);
  const eveningTarget = new Date(now);
  eveningTarget.setHours(settings.eveningWindowStart, 30, 0, 0);

  const morning = scoreWindow(
    settings.morningWindowStart,
    settings.morningWindowEnd,
    hourly,
    entries,
    settings,
    morningTarget,
  );
  const evening = scoreWindow(
    settings.eveningWindowStart,
    settings.eveningWindowEnd,
    hourly,
    entries,
    settings,
    eveningTarget,
  );

  const overallScore = Math.max(morning.score, evening.score);
  const overall = toLevel(overallScore, settings.sensitivity);

  // Merge top reasons deduplicated
  const seen = new Set<string>();
  const topReasons: string[] = [];
  for (const r of [...morning.reasons, ...evening.reasons]) {
    if (!seen.has(r)) { seen.add(r); topReasons.push(r); }
    if (topReasons.length >= 5) break;
  }

  return { overall, overallScore, morning, evening, topReasons, weatherAvailable: hourly !== null };
}
