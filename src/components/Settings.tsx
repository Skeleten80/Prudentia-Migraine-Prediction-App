import { useState, useRef } from 'react';
import type { AppSettings } from '../types';
import { getSettings, saveSettings, exportData, importData, DEFAULT_SETTINGS } from '../utils/storage';

function hourToTime(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function timeToHour(t: string) {
  return parseInt(t.split(':')[0], 10);
}

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState('');
  const [importOk, setImportOk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function update(patch: Partial<AppSettings>) {
    setSettings(prev => ({ ...prev, ...patch }));
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleExport() {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prudentia-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        importData(ev.target!.result as string);
        setImportOk(true);
        setImportError('');
        setSettings(getSettings());
        setTimeout(() => setImportOk(false), 2000);
      } catch {
        setImportError('Invalid file. Please choose a valid Prudentia JSON export.');
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleReset() {
    setSettings(DEFAULT_SETTINGS);
  }

  return (
    <div className="page">
      <div className="page-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <h1>Settings</h1>
      </div>

      {/* Risk windows */}
      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>Risk Windows</h2>

        <div className="row">
          <div>
            <label htmlFor="morning-start">Morning start</label>
            <input
              id="morning-start"
              type="time"
              value={hourToTime(settings.morningWindowStart)}
              onChange={e => update({ morningWindowStart: timeToHour(e.target.value) })}
            />
          </div>
          <div>
            <label htmlFor="morning-end">Morning end</label>
            <input
              id="morning-end"
              type="time"
              value={hourToTime(settings.morningWindowEnd)}
              onChange={e => update({ morningWindowEnd: timeToHour(e.target.value) })}
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: '0.5rem' }}>
          <div>
            <label htmlFor="evening-start">Evening start</label>
            <input
              id="evening-start"
              type="time"
              value={hourToTime(settings.eveningWindowStart)}
              onChange={e => update({ eveningWindowStart: timeToHour(e.target.value) })}
            />
          </div>
          <div>
            <label htmlFor="evening-end">Evening end</label>
            <input
              id="evening-end"
              type="time"
              value={hourToTime(settings.eveningWindowEnd)}
              onChange={e => update({ eveningWindowEnd: timeToHour(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Sensitivity */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Risk Sensitivity</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Controls how easily the app triggers Moderate or High risk.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['low', 'normal', 'high'] as const).map(s => (
            <button
              key={s}
              type="button"
              className={settings.sensitivity === s ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, textTransform: 'capitalize' }}
              onClick={() => update({ sensitivity: s })}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 8 }}>
          {settings.sensitivity === 'low' && 'Fewer alerts — only very high-risk conditions trigger warnings.'}
          {settings.sensitivity === 'normal' && 'Balanced — standard thresholds for risk scoring.'}
          {settings.sensitivity === 'high' && 'More alerts — useful if you want early warnings.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={handleReset}>
          Reset defaults
        </button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saved}>
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Data management */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Data Management</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          All data is stored locally in your browser. Export to back it up or move it to another device.
        </p>

        <button className="btn-secondary w-full" onClick={handleExport}>
          Export data as JSON
        </button>

        <label htmlFor="import-file" style={{ marginTop: '0.75rem' }}>Import data from JSON</label>
        <input
          ref={fileRef}
          id="import-file"
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          style={{ padding: '0.4rem' }}
        />

        {importError && (
          <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: 6 }}>{importError}</p>
        )}
        {importOk && (
          <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: 6 }}>Data imported successfully.</p>
        )}
      </div>

      <div className="disclaimer" style={{ marginTop: '1rem' }}>
        This app is for personal tracking and prediction support only. It is not medical advice, diagnosis, or treatment.
        Data never leaves your device.
      </div>
    </div>
  );
}
