import { useState } from 'react';
import type { MigraineEntry } from '../types';
import { getEntries, deleteEntry } from '../utils/storage';
import LogMigraine from './LogMigraine';

function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function severityColor(n: number) {
  if (n <= 3) return 'var(--risk-low)';
  if (n <= 6) return 'var(--risk-moderate)';
  return 'var(--risk-high)';
}

function triggerLabel(t: string) {
  const map: Record<string, string> = {
    sleep: 'Sleep', stress: 'Stress', caffeine: 'Caffeine',
    hydration: 'Hydration', skipped_meal: 'Skipped meal',
    screen_time: 'Screen', weather: 'Weather', other: 'Other',
  };
  return map[t] ?? t;
}

export default function History() {
  const [entries, setEntries] = useState<MigraineEntry[]>(() =>
    getEntries().sort((a, b) => `${b.date}T${b.timeStarted}`.localeCompare(`${a.date}T${a.timeStarted}`))
  );
  const [editing, setEditing] = useState<MigraineEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function reload() {
    setEntries(
      getEntries().sort((a, b) => `${b.date}T${b.timeStarted}`.localeCompare(`${a.date}T${a.timeStarted}`))
    );
    setEditing(null);
  }

  function handleDelete(id: string) {
    deleteEntry(id);
    setConfirmDelete(null);
    reload();
  }

  if (editing) {
    return (
      <div className="page">
        <LogMigraine existing={editing} onSaved={reload} onCancel={() => setEditing(null)} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <h1>History</h1>
        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>No migraines logged yet.</p>
          <p>Use the Log tab to add your first entry.</p>
        </div>
      ) : (
        <div className="entry-list">
          {entries.map(entry => (
            <div key={entry.id} className="entry-card">
              <div className="entry-card-header">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {new Date(entry.date + 'T12:00').toLocaleDateString('en-CA', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                    {' '}at {entry.timeStarted}
                  </div>
                  <div className="entry-meta">
                    <span
                      className="meta-chip"
                      style={{ color: severityColor(entry.severity), borderColor: severityColor(entry.severity) + '55' }}
                    >
                      Severity {entry.severity}/10
                    </span>
                    <span className="meta-chip">{durationLabel(entry.duration)}</span>
                    {entry.triggers.map(t => (
                      <span key={t} className="meta-chip">{triggerLabel(t)}</span>
                    ))}
                  </div>
                  {entry.notes && (
                    <p style={{ marginTop: 6, fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {entry.notes}
                    </p>
                  )}
                </div>
                <div className="entry-actions">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => setEditing(entry)}
                    aria-label="Edit entry"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => setConfirmDelete(entry.id)}
                    aria-label="Delete entry"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete entry?</h2>
              <button className="btn-secondary btn-sm" onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
