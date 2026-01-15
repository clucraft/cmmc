import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Practices from './pages/Practices';
import PracticeDetail from './pages/PracticeDetail';
import POAMs from './pages/POAMs';
import Reports from './pages/Reports';

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
  return (
    <BrowserRouter>
      <div className="app">
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
          </ul>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/practices" element={<Practices />} />
            <Route path="/practices/:id" element={<PracticeDetail />} />
            <Route path="/poams" element={<POAMs />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
