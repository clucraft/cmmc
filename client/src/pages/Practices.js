import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../App';

function Practices() {
  const [practices, setPractices] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFamily = searchParams.get('family') || '';
  const selectedLevel = searchParams.get('level') || '';
  const selectedStatus = searchParams.get('status') || '';

  useEffect(() => {
    fetch(`${API_URL}/api/families`)
      .then(r => r.json())
      .then(setFamilies);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedFamily) params.append('familyId', selectedFamily);
    if (selectedLevel) params.append('level', selectedLevel);
    if (selectedStatus) params.append('status', selectedStatus);

    fetch(`${API_URL}/api/practices?${params}`)
      .then(r => r.json())
      .then(data => {
        setPractices(data);
        setLoading(false);
      });
  }, [selectedFamily, selectedLevel, selectedStatus]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const getStatusBadge = (status) => {
    const badges = {
      NOT_STARTED: { label: 'Not Started', class: 'badge-gray' },
      IN_PROGRESS: { label: 'In Progress', class: 'badge-yellow' },
      IMPLEMENTED: { label: 'Implemented', class: 'badge-green' },
      NOT_APPLICABLE: { label: 'N/A', class: 'badge-blue' },
    };
    const badge = badges[status] || badges.NOT_STARTED;
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  return (
    <div className="practices-page">
      <h2>NIST 800-171 Practices</h2>

      <div className="filters">
        <select
          value={selectedFamily}
          onChange={(e) => updateFilter('family', e.target.value)}
        >
          <option value="">All Families</option>
          {families.map(f => (
            <option key={f.id} value={f.id}>{f.id} - {f.name}</option>
          ))}
        </select>

        <select
          value={selectedLevel}
          onChange={(e) => updateFilter('level', e.target.value)}
        >
          <option value="">All Levels</option>
          <option value="1">Level 1</option>
          <option value="2">Level 2</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => updateFilter('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IMPLEMENTED">Implemented</option>
          <option value="NOT_APPLICABLE">Not Applicable</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading practices...</div>
      ) : (
        <>
          <div className="practices-count">
            Showing {practices.length} practice{practices.length !== 1 ? 's' : ''}
          </div>
          <div className="practices-list">
            {practices.map(practice => (
              <Link to={`/practices/${practice.id}`} key={practice.id} className="practice-card">
                <div className="practice-header">
                  <span className="practice-id">{practice.id}</span>
                  <span className={`level-badge level-${practice.cmmcLevel}`}>
                    L{practice.cmmcLevel}
                  </span>
                  {getStatusBadge(practice.assessments[0]?.status)}
                </div>
                <h3>{practice.title}</h3>
                <p className="practice-description">{practice.description}</p>
                <div className="practice-footer">
                  <span className="family-tag">{practice.family.name}</span>
                  {practice.poams?.length > 0 && (
                    <span className="poam-indicator">POA&M Active</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Practices;
