import { useEffect, useState } from 'react';
import type { RiskAssessment, WeatherHourly } from '../types';
import { getEntries, getSettings } from '../utils/storage';
import { fetchWeather, hourIndexForDate } from '../utils/weather';
import { assessRisk } from '../utils/prediction';
import type { RiskLevel } from '../types';

function RiskDot({ level }: { level: RiskLevel }) {
  const colors: Record<RiskLevel, string> = { Low: '#4ade80', Moderate: '#fbbf24', High: '#f87171' };
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: colors[level],
        flexShrink: 0,
      }}
    />
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 60 ? '#f87171' : pct >= 32 ? '#fbbf24' : '#4ade80';
  return (
    <div style={{ background: '#2a2f4a', borderRadius: 4, height: 6, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  );
}

export default function Dashboard() {
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [weather, setWeather] = useState<WeatherHourly | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const entries = getEntries();
      const settings = getSettings();
      let hourly: WeatherHourly | null = null;
      try {
        hourly = await fetchWeather();
        if (!cancelled) setWeather(hourly);
      } catch {
        if (!cancelled) setWeatherError(true);
      }
      if (!cancelled) {
        setRisk(assessRisk(entries, settings, hourly));
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const now = new Date();
  const settings = getSettings();

  // Current weather snapshot
  let currentWeather: { temp: number; humidity: number; pressure: number; wind: number } | null = null;
  if (weather) {
    const idx = hourIndexForDate(weather, now);
    currentWeather = {
      temp: weather.temperature_2m[idx],
      humidity: weather.relative_humidity_2m[idx],
      pressure: weather.surface_pressure[idx],
      wind: weather.wind_speed_10m[idx],
    };
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-header"><h1>Prudentia</h1></div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading forecast…
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
        <h1>Prudentia</h1>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {now.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Overall risk */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="section-label">Today's Migraine Risk</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <span className={`risk-badge ${risk?.overall}`}><RiskDot level={risk?.overall ?? 'Low'} />{risk?.overall}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: risk?.overall === 'High' ? 'var(--risk-high)' : risk?.overall === 'Moderate' ? 'var(--risk-moderate)' : 'var(--risk-low)' }}>
              {risk?.overallScore ?? 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>/ 100</div>
          </div>
        </div>
        <ScoreBar score={risk?.overallScore ?? 0} />
      </div>

      {/* Risk windows */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="section-label">Risk Windows</div>
        <div className="window-row">
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Morning {settings.morningWindowStart}–{settings.morningWindowEnd}h
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Score: {risk?.morning.score ?? 0}
            </div>
          </div>
          <span className={`risk-badge ${risk?.morning.level}`}>
            <RiskDot level={risk?.morning.level ?? 'Low'} />
            {risk?.morning.level}
          </span>
        </div>
        <div className="window-row">
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Evening {settings.eveningWindowStart}–{settings.eveningWindowEnd}h
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Score: {risk?.evening.score ?? 0}
            </div>
          </div>
          <span className={`risk-badge ${risk?.evening.level}`}>
            <RiskDot level={risk?.evening.level ?? 'Low'} />
            {risk?.evening.level}
          </span>
        </div>
      </div>

      {/* Why */}
      {risk && risk.topReasons.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="section-label">Why This Prediction</div>
          <ul className="reason-list">
            {risk.topReasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          {!risk.weatherAvailable && (
            <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Weather data unavailable — prediction based on history only.
            </p>
          )}
        </div>
      )}

      {/* Current weather */}
      {currentWeather && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="section-label">Current Weather – Stratford, ON</div>
          <div className="weather-grid">
            <div className="weather-stat">
              <div className="value">{currentWeather.temp.toFixed(1)}°C</div>
              <div className="label">Temperature</div>
            </div>
            <div className="weather-stat">
              <div className="value">{currentWeather.humidity.toFixed(0)}%</div>
              <div className="label">Humidity</div>
            </div>
            <div className="weather-stat">
              <div className="value">{currentWeather.pressure.toFixed(0)}</div>
              <div className="label">Pressure hPa</div>
            </div>
            <div className="weather-stat">
              <div className="value">{currentWeather.wind.toFixed(0)}</div>
              <div className="label">Wind km/h</div>
            </div>
          </div>
        </div>
      )}

      {weatherError && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Could not load weather — check your connection.
        </div>
      )}

      <div className="disclaimer">
        This app is for personal tracking and prediction support only. It is not medical advice, diagnosis, or treatment.
      </div>
    </div>
  );
}
