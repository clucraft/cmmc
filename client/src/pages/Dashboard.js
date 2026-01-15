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

  // Calculate SPRS gauge position (range: -203 to 110)
  const sprsMin = -203;
  const sprsMax = 110;
  const sprsRange = sprsMax - sprsMin;
  const sprsPercentage = ((dashboard?.sprsScore - sprsMin) / sprsRange) * 100;
  const sprsRotation = (sprsPercentage / 100) * 180 - 90; // -90 to 90 degrees

  const getSprsColor = (score) => {
    if (score >= 70) return '#4caf50';
    if (score >= 0) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="dashboard">
      <h2>Compliance Dashboard</h2>

      {/* Top Row - Key Metrics */}
      <div className="metrics-row">
        {/* SPRS Score Gauge */}
        <div className="metric-card sprs-gauge-card">
          <h3>SPRS Score</h3>
          <div className="gauge-container">
            <div className="gauge">
              <div className="gauge-body">
                <div className="gauge-fill" style={{
                  transform: `rotate(${sprsRotation}deg)`,
                  backgroundColor: getSprsColor(dashboard?.sprsScore || 0)
                }}></div>
                <div className="gauge-cover">
                  <span className="gauge-value" style={{ color: getSprsColor(dashboard?.sprsScore || 0) }}>
                    {dashboard?.sprsScore || 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="gauge-labels">
              <span>-203</span>
              <span>0</span>
              <span>110</span>
            </div>
          </div>
          <p className="metric-subtitle">Target: 110 for full compliance</p>
        </div>

        {/* Compliance Donut */}
        <div className="metric-card donut-card">
          <h3>Overall Compliance</h3>
          <div className="donut-container">
            <svg viewBox="0 0 36 36" className="donut-chart">
              {/* Background circle */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="3"
              />
              {/* Implemented (green) */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#4caf50"
                strokeWidth="3"
                strokeDasharray={`${(dashboard?.assessmentStatus?.IMPLEMENTED / dashboard?.totalPractices) * 100 || 0}, 100`}
              />
              {/* In Progress (orange) - offset by implemented */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#ff9800"
                strokeWidth="3"
                strokeDasharray={`${(dashboard?.assessmentStatus?.IN_PROGRESS / dashboard?.totalPractices) * 100 || 0}, 100`}
                strokeDashoffset={`-${(dashboard?.assessmentStatus?.IMPLEMENTED / dashboard?.totalPractices) * 100 || 0}`}
              />
              {/* Center text */}
              <text x="18" y="20.35" className="donut-text">{dashboard?.compliancePercentage || 0}%</text>
            </svg>
          </div>
          <div className="donut-legend">
            <span><i className="legend-dot green"></i> Implemented ({dashboard?.assessmentStatus?.IMPLEMENTED || 0})</span>
            <span><i className="legend-dot orange"></i> In Progress ({dashboard?.assessmentStatus?.IN_PROGRESS || 0})</span>
            <span><i className="legend-dot gray"></i> Not Started ({dashboard?.assessmentStatus?.NOT_STARTED || 0})</span>
          </div>
        </div>

        {/* Level Breakdown */}
        <div className="metric-card levels-card">
          <h3>Level Breakdown</h3>
          <div className="level-bars">
            <div className="level-bar-group">
              <div className="level-bar-label">
                <span>Level 1</span>
                <span>{dashboard?.levelStats?.level1?.implemented || 0}/{dashboard?.levelStats?.level1?.total || 0}</span>
              </div>
              <div className="level-bar-track">
                <div
                  className="level-bar-fill level1"
                  style={{
                    width: `${dashboard?.levelStats?.level1?.total > 0
                      ? (dashboard?.levelStats?.level1?.implemented / dashboard?.levelStats?.level1?.total) * 100
                      : 0}%`
                  }}
                ></div>
              </div>
            </div>
            <div className="level-bar-group">
              <div className="level-bar-label">
                <span>Level 2</span>
                <span>{dashboard?.levelStats?.level2?.implemented || 0}/{dashboard?.levelStats?.level2?.total || 0}</span>
              </div>
              <div className="level-bar-track">
                <div
                  className="level-bar-fill level2"
                  style={{
                    width: `${dashboard?.levelStats?.level2?.total > 0
                      ? (dashboard?.levelStats?.level2?.implemented / dashboard?.levelStats?.level2?.total) * 100
                      : 0}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
          <p className="metric-subtitle">
            Level 1: Basic safeguarding | Level 2: Full CUI protection
          </p>
        </div>
      </div>

      {/* Second Row - POA&M Status and Evidence */}
      <div className="metrics-row">
        <div className="metric-card poam-summary-card">
          <h3>POA&M Status</h3>
          <div className="poam-status-grid">
            <div className="poam-status-item">
              <span className="poam-status-value open">{dashboard?.poamStatus?.OPEN || 0}</span>
              <span className="poam-status-label">Open</span>
            </div>
            <div className="poam-status-item">
              <span className="poam-status-value in-progress">{dashboard?.poamStatus?.IN_PROGRESS || 0}</span>
              <span className="poam-status-label">In Progress</span>
            </div>
            <div className="poam-status-item">
              <span className="poam-status-value delayed">{dashboard?.overduePoams?.length || 0}</span>
              <span className="poam-status-label">Overdue</span>
            </div>
            <div className="poam-status-item">
              <span className="poam-status-value completed">{dashboard?.poamStatus?.COMPLETED || 0}</span>
              <span className="poam-status-label">Completed</span>
            </div>
          </div>
        </div>

        <div className="metric-card evidence-card">
          <h3>Evidence Coverage</h3>
          <div className="evidence-stat">
            <span className="evidence-percentage" style={{ color: getScoreColor(dashboard?.evidenceCoverage?.percentage || 0) }}>
              {dashboard?.evidenceCoverage?.percentage || 0}%
            </span>
            <span className="evidence-label">of implemented practices have evidence</span>
          </div>
          <div className="evidence-details">
            <span className="evidence-good">{dashboard?.evidenceCoverage?.withEvidence || 0} documented</span>
            <span className="evidence-bad">{dashboard?.evidenceCoverage?.withoutEvidence || 0} need evidence</span>
          </div>
        </div>
      </div>

      {/* Overdue POA&Ms Alert */}
      {dashboard?.overduePoams?.length > 0 && (
        <div className="alert-section">
          <h3 className="alert-header">Overdue POA&Ms</h3>
          <div className="overdue-list">
            {dashboard.overduePoams.map(poam => (
              <Link to={`/practices/${poam.practiceId}`} key={poam.id} className="overdue-item">
                <div className="overdue-info">
                  <span className="overdue-practice">{poam.practiceId}: {poam.practiceTitle}</span>
                  <span className="overdue-weakness">{poam.weakness}</span>
                </div>
                <div className="overdue-meta">
                  <span className={`priority-badge ${poam.priority.toLowerCase()}`}>{poam.priority}</span>
                  <span className="overdue-days">{poam.daysOverdue} days overdue</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Control Family Heatmap */}
      <h3>Control Family Compliance</h3>
      <div className="heatmap-container">
        {families.map(family => {
          const percentage = family.compliancePercentage;
          let heatClass = 'heat-red';
          if (percentage >= 80) heatClass = 'heat-green';
          else if (percentage >= 50) heatClass = 'heat-yellow';
          else if (percentage >= 25) heatClass = 'heat-orange';

          return (
            <Link to={`/practices?family=${family.id}`} key={family.id} className={`heatmap-cell ${heatClass}`}>
              <span className="heatmap-id">{family.id}</span>
              <span className="heatmap-percent">{percentage}%</span>
              <span className="heatmap-name">{family.name}</span>
              <span className="heatmap-count">{family.implementedPractices}/{family.totalPractices}</span>
            </Link>
          );
        })}
      </div>

      {/* Upcoming Deadlines */}
      {dashboard?.upcomingPoams?.length > 0 && (
        <div className="upcoming-section">
          <h3>Upcoming Deadlines (Next 30 Days)</h3>
          <div className="upcoming-list">
            {dashboard.upcomingPoams.map(poam => (
              <Link to={`/practices/${poam.practiceId}`} key={poam.id} className="upcoming-item">
                <div className="upcoming-info">
                  <span className="upcoming-practice">{poam.practiceId}: {poam.practiceTitle}</span>
                </div>
                <div className="upcoming-meta">
                  <span className={`priority-badge ${poam.priority.toLowerCase()}`}>{poam.priority}</span>
                  <span className="upcoming-days">
                    {poam.daysUntilDue === 0 ? 'Due today' : `${poam.daysUntilDue} days left`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
