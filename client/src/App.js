import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Practices from './pages/Practices';
import PracticeDetail from './pages/PracticeDetail';
import POAMs from './pages/POAMs';
import Reports from './pages/Reports';
import SystemInfo from './pages/SystemInfo';

// Dynamically determine API URL based on current hostname
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Use same hostname as the client, but port 5000
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000`;
};

const API_URL = getApiUrl();

export { API_URL };

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('cmmc-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('cmmc-dark-mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
        <nav className="sidebar">
          <div className="sidebar-header">
            <h1>CMMC</h1>
            <span className="subtitle">Compliance Tracker</span>
          </div>
          <ul className="nav-links">
            <li>
              <NavLink to="/" end>Dashboard</NavLink>
            </li>
            <li>
              <NavLink to="/practices">Practices</NavLink>
            </li>
            <li>
              <NavLink to="/poams">POA&Ms</NavLink>
            </li>
            <li>
              <NavLink to="/reports">Reports</NavLink>
            </li>
            <li>
              <NavLink to="/system-info">System Info</NavLink>
            </li>
          </ul>
          <div className="sidebar-footer">
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm0 15a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zm9-6a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zM5 12a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zm14.071-5.071a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zM7.05 16.95a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zm12.021.707a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 1 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414zM7.05 7.05a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 0 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
                </svg>
              )}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/practices" element={<Practices />} />
            <Route path="/practices/:id" element={<PracticeDetail />} />
            <Route path="/poams" element={<POAMs />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/system-info" element={<SystemInfo />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
