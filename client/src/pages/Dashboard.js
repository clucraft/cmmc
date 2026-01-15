import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../App';

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/dashboard`).then(r => r.json()),
      fetch(`${API_URL}/api/families`).then(r => r.json()),
    ])
      .then(([dashData, familyData]) => {
        setDashboard(dashData);
        setFamilies(familyData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 50) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="dashboard">
      <h2>Compliance Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-value" style={{ color: getScoreColor(dashboard?.compliancePercentage || 0) }}>
            {dashboard?.compliancePercentage || 0}%
          </div>
          <div className="stat-label">Overall Compliance</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{dashboard?.totalPractices || 0}</div>
          <div className="stat-label">Total Practices</div>
        </div>

        <div className="stat-card success">
          <div className="stat-value">{dashboard?.assessmentStatus?.IMPLEMENTED || 0}</div>
          <div className="stat-label">Implemented</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-value">{dashboard?.assessmentStatus?.IN_PROGRESS || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>

        <div className="stat-card danger">
          <div className="stat-value">{dashboard?.assessmentStatus?.NOT_STARTED || 0}</div>
          <div className="stat-label">Not Started</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {(dashboard?.poamStatus?.OPEN || 0) + (dashboard?.poamStatus?.IN_PROGRESS || 0)}
          </div>
          <div className="stat-label">Open POA&Ms</div>
        </div>
      </div>

      <h3>Compliance by Control Family</h3>
      <div className="family-grid">
        {families.map(family => (
          <Link to={`/practices?family=${family.id}`} key={family.id} className="family-card">
            <div className="family-header">
              <span className="family-id">{family.id}</span>
              <span className="family-name">{family.name}</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${family.compliancePercentage}%`,
                  backgroundColor: getScoreColor(family.compliancePercentage)
                }}
              />
            </div>
            <div className="family-stats">
              <span>{family.implementedPractices}/{family.totalPractices} complete</span>
              <span className="percentage">{family.compliancePercentage}%</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
