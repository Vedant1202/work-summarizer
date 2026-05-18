import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Config from './pages/Config';
import Reports from './pages/Reports';
import Doctor from './pages/Doctor';
import Mintlify from './pages/Mintlify';

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
        <nav style={{ width: 200, background: '#111', color: '#fff', padding: '24px 12px', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#888', letterSpacing: '0.08em', marginBottom: 24, paddingLeft: 12 }}>
            DAILY SUMMARY
          </div>
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
                color: isActive ? '#fff' : '#aaa',
                background: isActive ? '#2a2a2a' : 'transparent',
                fontSize: 14,
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <main style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
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
