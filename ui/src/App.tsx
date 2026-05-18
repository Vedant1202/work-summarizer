import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Config from './pages/Config';
import Reports from './pages/Reports';
import Doctor from './pages/Doctor';
import Mintlify from './pages/Mintlify';

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return (
    <div style={{ fontSize: 11, color: '#93c5fd', marginBottom: 20, paddingLeft: 12, lineHeight: 1.6 }}>
      <div>{dateStr}</div>
      <div style={{ fontWeight: 600 }}>{timeStr}</div>
    </div>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/config', label: 'Config' },
  { to: '/reports', label: 'Reports' },
  { to: '/mintlify', label: 'Mintlify' },
  { to: '/doctor', label: 'Doctor' },
];

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <nav style={{ width: 200, background: '#0f172a', color: '#fff', padding: '24px 12px', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.08em', marginBottom: 12, paddingLeft: 12 }}>
            DAILY SUMMARY
          </div>
          <LiveClock />
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'block',
                padding: '8px 12px',
                marginBottom: 2,
                borderRadius: 6,
                textDecoration: 'none',
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? '#2563eb' : 'transparent',
                fontSize: 14,
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <main style={{ flex: 1, padding: 40, overflowY: 'auto', background: '#f8fafc' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/config" element={<Config />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/mintlify" element={<Mintlify />} />
            <Route path="/doctor" element={<Doctor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
