import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/dashboard`)
      .then(res => res.json())
      .then(data => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load dashboard data');
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>CMMC Dashboard</h1>
        <div className="status">
          <span className="status-dot"></span>
          <span>System Online</span>
        </div>
      </header>

      <main className="main">
        <h2>Welcome to CMMC</h2>

        {loading && <p className="loading">Loading dashboard...</p>}

        {error && <p className="error">{error}</p>}

        {stats && (
          <div className="dashboard-grid">
            <div className="card">
              <h3>Total Users</h3>
              <p className="value">{stats.users}</p>
            </div>
            <div className="card">
              <h3>Active Projects</h3>
              <p className="value">{stats.activeProjects}</p>
            </div>
            <div className="card">
              <h3>Completed Tasks</h3>
              <p className="value">{stats.completedTasks}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
