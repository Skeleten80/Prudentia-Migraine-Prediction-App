import { useState } from 'react';
import type { MigraineEntry, Trigger } from '../types';
import { saveEntry, newEntryId } from '../utils/storage';

const TRIGGERS: { key: Trigger; label: string }[] = [
  { key: 'sleep', label: 'Poor sleep' },
  { key: 'stress', label: 'Stress' },
  { key: 'caffeine', label: 'Caffeine' },
  { key: 'hydration', label: 'Dehydration' },
  { key: 'skipped_meal', label: 'Skipped meal' },
  { key: 'screen_time', label: 'Screen time' },
  { key: 'weather', label: 'Weather' },
  { key: 'other', label: 'Other' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function severityColor(n: number) {
  if (n <= 3) return '#4ade80';
  if (n <= 6) return '#fbbf24';
  return '#f87171';
}

interface Props {
  existing?: MigraineEntry;
  onSaved: () => void;
  onCancel?: () => void;
}

export default function LogMigraine({ existing, onSaved, onCancel }: Props) {
  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [timeStarted, setTimeStarted] = useState(existing?.timeStarted ?? nowTimeStr());
  const [severity, setSeverity] = useState(existing?.severity ?? 5);
  const [duration, setDuration] = useState(existing?.duration ?? 60);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [triggers, setTriggers] = useState<Set<Trigger>>(new Set(existing?.triggers ?? []));
  const [saved, setSaved] = useState(false);

  const isEdit = !!existing;

  function toggleTrigger(t: Trigger) {
    setTriggers(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entry: MigraineEntry = {
      id: existing?.id ?? newEntryId(),
      date,
      timeStarted,
      severity,
      duration,
      notes: notes.trim(),
      triggers: Array.from(triggers),
    };
    saveEntry(entry);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSaved();
    }, 800);
  }

  const showSevereWarning =
    severity >= 9 ||
    notes.toLowerCase().includes('sudden') ||
    notes.toLowerCase().includes('worst') ||
    notes.toLowerCase().includes('vision') ||
    notes.toLowerCase().includes('numb') ||
    notes.toLowerCase().includes('confused') ||
    notes.toLowerCase().includes('speech') ||
    notes.toLowerCase().includes('weakness');

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        {!isEdit && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
        <h1>{isEdit ? 'Edit Entry' : 'Log Migraine'}</h1>
      </div>

      <div className="card">
        <div className="row">
          <div>
            <label htmlFor="log-date">Date</label>
            <input id="log-date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="log-time">Time started</label>
            <input id="log-time" type="time" value={timeStarted} onChange={e => setTimeStarted(e.target.value)} required />
          </div>
        </div>

        <label htmlFor="log-severity">Severity: {severity} / 10</label>
        <div className="severity-display">
          <input
            id="log-severity"
            type="range"
            min={1}
            max={10}
            value={severity}
            onChange={e => setSeverity(Number(e.target.value))}
          />
          <span className="severity-num" style={{ color: severityColor(severity) }}>{severity}</span>
        </div>

        <label htmlFor="log-duration">Duration (minutes)</label>
        <input
          id="log-duration"
          type="number"
          min={1}
          max={4320}
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          required
        />

        <label>Possible triggers</label>
        <div className="trigger-grid">
          {TRIGGERS.map(t => (
            <button
              key={t.key}
              type="button"
              className={`trigger-chip${triggers.has(t.key) ? ' selected' : ''}`}
              onClick={() => toggleTrigger(t.key)}
              aria-pressed={triggers.has(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label htmlFor="log-notes">Notes</label>
        <textarea
          id="log-notes"
          placeholder="Any additional observations…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      {showSevereWarning && (
        <div className="medical-warning">
          <strong>Please consider seeking medical attention.</strong> Severe pain, sudden onset, or neurological
          symptoms (vision changes, numbness, confusion, weakness, speech difficulty) can indicate conditions
          requiring urgent care. This app cannot diagnose or advise on treatment.
        </div>
      )}

      <div className="disclaimer">
        This app is for personal tracking and prediction support only. It is not medical advice, diagnosis, or treatment.
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
        {onCancel && (
          <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={saved}>
          {saved ? 'Saved!' : isEdit ? 'Save Changes' : 'Log Migraine'}
        </button>
      </div>
    </form>
  );
}
