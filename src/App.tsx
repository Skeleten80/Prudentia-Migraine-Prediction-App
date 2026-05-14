import { useState } from 'react';
import Dashboard from './components/Dashboard';
import LogMigraine from './components/LogMigraine';
import History from './components/History';
import WeatherTrends from './components/WeatherTrends';
import Settings from './components/Settings';

type Tab = 'dashboard' | 'log' | 'history' | 'weather' | 'settings';

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconLog() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconWeather() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const NAV_ITEMS: { tab: Tab; label: string; Icon: () => JSX.Element }[] = [
  { tab: 'dashboard', label: 'Home', Icon: IconDashboard },
  { tab: 'log', label: 'Log', Icon: IconLog },
  { tab: 'history', label: 'History', Icon: IconHistory },
  { tab: 'weather', label: 'Weather', Icon: IconWeather },
  { tab: 'settings', label: 'Settings', Icon: IconSettings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [logKey, setLogKey] = useState(0);

  function handleLogSaved() {
    setLogKey(k => k + 1);
    setActiveTab('history');
  }

  function renderContent() {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'log': return (
        <div className="page">
          <LogMigraine key={logKey} onSaved={handleLogSaved} />
        </div>
      );
      case 'history': return <History />;
      case 'weather': return <WeatherTrends />;
      case 'settings': return <Settings />;
    }
  }

  return (
    <>
      <main style={{ flex: 1 }}>
        {renderContent()}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ tab, label, Icon }) => (
          <button
            key={tab}
            className={`nav-btn${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
            aria-label={label}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
