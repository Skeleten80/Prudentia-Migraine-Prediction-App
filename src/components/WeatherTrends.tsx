import { useEffect, useState } from 'react';
import type { WeatherHourly } from '../types';
import { fetchWeather, getWeatherSlice, hourIndexForDate } from '../utils/weather';
import { getEntries } from '../utils/storage';
import SimpleChart from './SimpleChart';

function formatHour(isoStr: string) {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}h`;
}

export default function WeatherTrends() {
  const [hourly, setHourly] = useState<WeatherHourly | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather()
      .then(h => { setHourly(h); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const entries = getEntries();

  if (loading) {
    return (
      <div className="page">
        <div className="page-header"><h1>Weather Trends</h1></div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading weather data…
        </div>
      </div>
    );
  }

  if (error || !hourly) {
    return (
      <div className="page">
        <div className="page-header"><h1>Weather Trends</h1></div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Unable to load weather data. Check your connection and try again.
        </div>
      </div>
    );
  }

  const now = new Date();
  const slice = getWeatherSlice(hourly, now, 24);
  const labels = slice.time.map(formatHour);

  // Find migraine events that fall within the next-24h slice
  const sliceStart = new Date(slice.time[0]).getTime();
  const sliceEnd = new Date(slice.time[slice.time.length - 1]).getTime();

  const migraineDots = entries
    .map(e => {
      const ts = new Date(`${e.date}T${e.timeStarted}`).getTime();
      if (ts < sliceStart || ts > sliceEnd) return null;
      const closestIdx = slice.time.reduce((best, t, i) => {
        const diff = Math.abs(new Date(t).getTime() - ts);
        return diff < Math.abs(new Date(slice.time[best]).getTime() - ts) ? i : best;
      }, 0);
      return { index: closestIdx, color: '#f87171', label: `Migraine (sev ${e.severity})` };
    })
    .filter(Boolean) as { index: number; color: string; label: string }[];

  // Past 7-day correlation data (hourly weather at each migraine event)
  const past7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentEntries = entries.filter(e => new Date(`${e.date}T${e.timeStarted}`).getTime() > past7);

  return (
    <div className="page">
      <div className="page-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <h1>Weather Trends</h1>
      </div>

      {/* 24h forecast charts */}
      <div className="card">
        <div className="section-label">Next 24h – Atmospheric Pressure (hPa)</div>
        <SimpleChart
          data={slice.surface_pressure}
          labels={labels}
          color="#6b8cff"
          height={110}
          dots={migraineDots}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
          Drops &gt;3 hPa are associated with increased migraine risk.
          {migraineDots.length > 0 && ' Red dots = logged migraines.'}
        </p>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="section-label">Next 24h – Humidity (%)</div>
        <SimpleChart
          data={slice.relative_humidity_2m}
          labels={labels}
          color="#9b7fff"
          height={110}
          unit="%"
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
          Humidity above 70% may increase risk.
        </p>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="section-label">Next 24h – Temperature (°C)</div>
        <SimpleChart
          data={slice.temperature_2m}
          labels={labels}
          color="#fbbf24"
          height={110}
          unit="°"
        />
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="section-label">Next 24h – Precipitation (mm)</div>
        <SimpleChart
          data={slice.precipitation}
          labels={labels}
          color="#4ade80"
          height={90}
          unit="mm"
        />
      </div>

      {/* Correlation summary */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="section-label">Your Recent Patterns (7 days)</div>
        {recentEntries.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No migraines logged in the last 7 days.
          </p>
        ) : (
          <div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 10 }}>
              {recentEntries.length} migraine{recentEntries.length > 1 ? 's' : ''} in the past 7 days.
            </p>
            {recentEntries.map(e => {
              const ts = new Date(`${e.date}T${e.timeStarted}`);
              const idx = hourIndexForDate(hourly, ts);
              const pressure = hourly.surface_pressure[idx];
              const humidity = hourly.relative_humidity_2m[idx];
              const pastIdx = Math.max(0, idx - 24);
              const pressureDrop = pressure - hourly.surface_pressure[pastIdx];
              return (
                <div
                  key={e.id}
                  style={{
                    background: 'var(--bg-input)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 8,
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {new Date(e.date + 'T12:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' '}{e.timeStarted} — Sev {e.severity}/10
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>Pressure: {pressure.toFixed(0)} hPa ({pressureDrop > 0 ? '+' : ''}{pressureDrop.toFixed(1)})</span>
                    <span>Humidity: {humidity.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="disclaimer">
        Weather data from Open-Meteo for Stratford, Ontario. Correlations shown are observational only, not causal.
      </div>
    </div>
  );
}
