import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Practices from './pages/Practices';
import PracticeDetail from './pages/PracticeDetail';
import POAMs from './pages/POAMs';
import Reports from './pages/Reports';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
