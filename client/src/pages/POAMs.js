import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../App';

function POAMs() {
  const [poams, setPoams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '' });

  const fetchPoams = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.priority) params.append('priority', filter.priority);

    fetch(`${API_URL}/api/poams?${params}`)
      .then(r => r.json())
      .then(data => {
        setPoams(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPoams();
  }, [filter]);

  const updatePoamStatus = async (poamId, newStatus) => {
    await fetch(`${API_URL}/api/poams/${poamId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchPoams();
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority.toLowerCase()}`;
  };

  const getStatusClass = (status) => {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  };

  const stats = {
    open: poams.filter(p => p.status === 'OPEN').length,
    inProgress: poams.filter(p => p.status === 'IN_PROGRESS').length,
    completed: poams.filter(p => p.status === 'COMPLETED').length,
    delayed: poams.filter(p => p.status === 'DELAYED').length,
  };

  return (
    <div className="poams-page">
      <h2>Plans of Action & Milestones</h2>

      <div className="poam-stats">
        <div className="poam-stat">
          <span className="stat-number">{stats.open}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="poam-stat">
          <span className="stat-number">{stats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="poam-stat">
          <span className="stat-number">{stats.delayed}</span>
          <span className="stat-label">Delayed</span>
        </div>
        <div className="poam-stat">
          <span className="stat-number">{stats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      <div className="filters">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DELAYED">Delayed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading POA&Ms...</div>
      ) : poams.length === 0 ? (
        <div className="empty-state">
          <p>No POA&Ms found.</p>
          <p>POA&Ms are created from individual practice pages when gaps are identified.</p>
        </div>
      ) : (
        <div className="poams-list">
          {poams.map(poam => (
            <div key={poam.id} className="poam-list-card">
              <div className="poam-list-header">
                <Link to={`/practices/${poam.practiceId}`} className="practice-link">
                  {poam.practice.id} - {poam.practice.title}
                </Link>
                <div className="poam-badges">
                  <span className={`badge ${getPriorityClass(poam.priority)}`}>
                    {poam.priority}
                  </span>
                  <span className={`badge ${getStatusClass(poam.status)}`}>
                    {poam.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="poam-weakness">{poam.weakness}</p>

              <div className="poam-details">
                <div className="poam-detail">
                  <label>Family:</label>
                  <span>{poam.practice.family.name}</span>
                </div>
                {poam.assignedTo && (
                  <div className="poam-detail">
                    <label>Assigned:</label>
                    <span>{poam.assignedTo}</span>
                  </div>
                )}
                {poam.scheduledCompletionDate && (
                  <div className="poam-detail">
                    <label>Due:</label>
                    <span>{new Date(poam.scheduledCompletionDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {poam.milestones?.length > 0 && (
                <div className="poam-milestones">
                  <h4>Milestones</h4>
                  <ul>
                    {poam.milestones.map(m => (
                      <li key={m.id} className={m.completed ? 'completed' : ''}>
                        {m.description}
                        {m.dueDate && ` (Due: ${new Date(m.dueDate).toLocaleDateString()})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="poam-actions">
                {poam.status === 'OPEN' && (
                  <button
                    onClick={() => updatePoamStatus(poam.id, 'IN_PROGRESS')}
                    className="btn btn-small"
                  >
                    Start Work
                  </button>
                )}
                {poam.status === 'IN_PROGRESS' && (
                  <>
                    <button
                      onClick={() => updatePoamStatus(poam.id, 'COMPLETED')}
                      className="btn btn-small btn-success"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => updatePoamStatus(poam.id, 'DELAYED')}
                      className="btn btn-small btn-warning"
                    >
                      Mark Delayed
                    </button>
                  </>
                )}
                {poam.status === 'DELAYED' && (
                  <button
                    onClick={() => updatePoamStatus(poam.id, 'IN_PROGRESS')}
                    className="btn btn-small"
                  >
                    Resume Work
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default POAMs;
