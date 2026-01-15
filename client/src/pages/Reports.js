import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

function Reports() {
  const [sprsData, setSprsData] = useState(null);
  const [familyReport, setFamilyReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/reports/sprs-score`).then(r => r.json()),
      fetch(`${API_URL}/api/reports/compliance-by-family`).then(r => r.json()),
    ])
      .then(([sprs, family]) => {
        setSprsData(sprs);
        setFamilyReport(family);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading reports...</div>;

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 0) return '#ff9800';
    return '#f44336';
  };

  const sprsPercentage = ((sprsData.sprsScore - sprsData.minScore) / (sprsData.maxScore - sprsData.minScore)) * 100;

  return (
    <div className="reports-page">
      <h2>Compliance Reports</h2>

      <div className="report-section">
        <h3>SPRS Score</h3>
        <p className="report-description">
          Supplier Performance Risk System (SPRS) score based on NIST 800-171 implementation.
          Range: {sprsData.minScore} (no controls) to {sprsData.maxScore} (fully compliant).
        </p>

        <div className="sprs-display">
          <div className="sprs-score" style={{ color: getScoreColor(sprsData.sprsScore) }}>
            {sprsData.sprsScore}
          </div>
          <div className="sprs-meter">
            <div className="sprs-meter-bg">
              <div
                className="sprs-meter-fill"
                style={{
                  width: `${Math.max(0, sprsPercentage)}%`,
                  backgroundColor: getScoreColor(sprsData.sprsScore)
                }}
              />
            </div>
            <div className="sprs-labels">
              <span>{sprsData.minScore}</span>
              <span>0</span>
              <span>{sprsData.maxScore}</span>
            </div>
          </div>
        </div>

        <div className="sprs-info">
          <p><strong>{sprsData.gapCount}</strong> practices require attention</p>
        </div>

        {sprsData.gaps?.length > 0 && (
          <div className="gaps-list">
            <h4>Top Gaps to Address</h4>
            <table>
              <thead>
                <tr>
                  <th>Practice</th>
                  <th>Title</th>
                  <th>Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sprsData.gaps.map(gap => (
                  <tr key={gap.id}>
                    <td>{gap.id}</td>
                    <td>{gap.title}</td>
                    <td>L{gap.level}</td>
                    <td>{gap.status.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="report-section">
        <h3>Compliance by Control Family</h3>
        <table className="family-report-table">
          <thead>
            <tr>
              <th>Family</th>
              <th>Total</th>
              <th>Implemented</th>
              <th>In Progress</th>
              <th>Not Started</th>
              <th>N/A</th>
              <th>Compliance</th>
            </tr>
          </thead>
          <tbody>
            {familyReport.map(family => (
              <tr key={family.familyId}>
                <td>
                  <strong>{family.familyId}</strong> - {family.familyName}
                </td>
                <td>{family.total}</td>
                <td className="cell-success">{family.IMPLEMENTED}</td>
                <td className="cell-warning">{family.IN_PROGRESS}</td>
                <td className="cell-danger">{family.NOT_STARTED}</td>
                <td>{family.NOT_APPLICABLE}</td>
                <td>
                  <div className="mini-progress">
                    <div
                      className="mini-progress-fill"
                      style={{
                        width: `${family.compliancePercentage}%`,
                        backgroundColor: getScoreColor(family.compliancePercentage)
                      }}
                    />
                    <span>{family.compliancePercentage}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="report-section">
        <h3>Export Options</h3>
        <div className="export-buttons">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            Print Report
          </button>
          <button className="btn btn-secondary" disabled>
            Export to PDF (Coming Soon)
          </button>
          <button className="btn btn-secondary" disabled>
            Generate SSP (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;
