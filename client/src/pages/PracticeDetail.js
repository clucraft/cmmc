import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../App';

function PracticeDetail() {
  const { id } = useParams();
  const [practice, setPractice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessment, setAssessment] = useState({
    status: 'NOT_STARTED',
    notes: '',
    assessedBy: '',
  });
  const [showPoamForm, setShowPoamForm] = useState(false);
  const [newPoam, setNewPoam] = useState({
    weakness: '',
    assignedTo: '',
    scheduledCompletionDate: '',
    priority: 'MEDIUM',
  });
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/practices/${id}`)
      .then(r => r.json())
      .then(data => {
        setPractice(data);
        if (data.assessments[0]) {
          setAssessment({
            status: data.assessments[0].status,
            notes: data.assessments[0].notes || '',
            assessedBy: data.assessments[0].assessedBy || '',
          });
        }
        setLoading(false);
      });
  }, [id]);

  const saveAssessment = async () => {
    setSaving(true);
    await fetch(`${API_URL}/api/assessments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessment),
    });
    setSaving(false);
    alert('Assessment saved!');
  };

  const createPoam = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/poams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newPoam, practiceId: id }),
    });
    setShowPoamForm(false);
    // Refresh practice data
    const updated = await fetch(`${API_URL}/api/practices/${id}`).then(r => r.json());
    setPractice(updated);
  };

  const uploadEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', evidenceFile);
    formData.append('description', evidenceDescription);

    try {
      await fetch(`${API_URL}/api/practices/${id}/evidence`, {
        method: 'POST',
        body: formData,
      });
      setShowEvidenceForm(false);
      setEvidenceFile(null);
      setEvidenceDescription('');
      // Refresh practice data
      const updated = await fetch(`${API_URL}/api/practices/${id}`).then(r => r.json());
      setPractice(updated);
    } catch (error) {
      alert('Failed to upload evidence');
    }
    setUploading(false);
  };

  const deleteEvidence = async (evidenceId) => {
    if (!window.confirm('Are you sure you want to delete this evidence?')) return;

    try {
      await fetch(`${API_URL}/api/evidence/${evidenceId}`, {
        method: 'DELETE',
      });
      // Refresh practice data
      const updated = await fetch(`${API_URL}/api/practices/${id}`).then(r => r.json());
      setPractice(updated);
    } catch (error) {
      alert('Failed to delete evidence');
    }
  };

  if (loading) return <div className="loading">Loading practice...</div>;
  if (!practice) return <div className="error">Practice not found</div>;

  return (
    <div className="practice-detail">
      <Link to="/practices" className="back-link">&larr; Back to Practices</Link>

      <div className="practice-header-detail">
        <div className="practice-meta">
          <span className="practice-id-large">{practice.id}</span>
          <span className={`level-badge level-${practice.cmmcLevel}`}>
            Level {practice.cmmcLevel}
          </span>
        </div>
        <h2>{practice.title}</h2>
        <p className="family-info">{practice.family.id} - {practice.family.name}</p>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <h3>Description</h3>
          <p>{practice.description}</p>

          {practice.discussion && (
            <>
              <h3>Discussion</h3>
              <p>{practice.discussion}</p>
            </>
          )}
        </div>

        <div className="detail-section">
          <h3>Assessment</h3>
          <div className="form-group">
            <label>Status</label>
            <select
              value={assessment.status}
              onChange={(e) => setAssessment({ ...assessment, status: e.target.value })}
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IMPLEMENTED">Implemented</option>
              <option value="NOT_APPLICABLE">Not Applicable</option>
            </select>
          </div>

          <div className="form-group">
            <label>Assessed By</label>
            <input
              type="text"
              value={assessment.assessedBy}
              onChange={(e) => setAssessment({ ...assessment, assessedBy: e.target.value })}
              placeholder="Your name"
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={assessment.notes}
              onChange={(e) => setAssessment({ ...assessment, notes: e.target.value })}
              placeholder="Implementation notes, evidence references, etc."
              rows={4}
            />
          </div>

          <button onClick={saveAssessment} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>

      <div className="detail-section">
        <div className="section-header">
          <h3>POA&Ms ({practice.poams?.length || 0})</h3>
          <button onClick={() => setShowPoamForm(true)} className="btn btn-secondary">
            + Add POA&M
          </button>
        </div>

        {showPoamForm && (
          <form onSubmit={createPoam} className="poam-form">
            <div className="form-group">
              <label>Weakness Description *</label>
              <textarea
                value={newPoam.weakness}
                onChange={(e) => setNewPoam({ ...newPoam, weakness: e.target.value })}
                required
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Assigned To</label>
                <input
                  type="text"
                  value={newPoam.assignedTo}
                  onChange={(e) => setNewPoam({ ...newPoam, assignedTo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Target Date</label>
                <input
                  type="date"
                  value={newPoam.scheduledCompletionDate}
                  onChange={(e) => setNewPoam({ ...newPoam, scheduledCompletionDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newPoam.priority}
                  onChange={(e) => setNewPoam({ ...newPoam, priority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Create POA&M</button>
              <button type="button" onClick={() => setShowPoamForm(false)} className="btn">Cancel</button>
            </div>
          </form>
        )}

        {practice.poams?.map(poam => (
          <div key={poam.id} className={`poam-card poam-${poam.status.toLowerCase()}`}>
            <div className="poam-header">
              <span className={`badge badge-${poam.priority.toLowerCase()}`}>{poam.priority}</span>
              <span className={`badge badge-status-${poam.status.toLowerCase()}`}>{poam.status}</span>
            </div>
            <p className="poam-weakness">{poam.weakness}</p>
            <div className="poam-meta">
              {poam.assignedTo && <span>Assigned: {poam.assignedTo}</span>}
              {poam.scheduledCompletionDate && (
                <span>Due: {new Date(poam.scheduledCompletionDate).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="detail-section">
        <div className="section-header">
          <h3>Evidence ({practice.evidence?.length || 0})</h3>
          <button onClick={() => setShowEvidenceForm(true)} className="btn btn-secondary">
            + Upload Evidence
          </button>
        </div>

        {showEvidenceForm && (
          <form onSubmit={uploadEvidence} className="evidence-form">
            <div className="form-group">
              <label>File *</label>
              <input
                type="file"
                onChange={(e) => setEvidenceFile(e.target.files[0])}
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv,.zip"
              />
              <small className="form-help">
                Allowed: PDF, Word, Excel, Images, Text, CSV, ZIP (max 50MB)
              </small>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                placeholder="Brief description of this evidence"
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={uploading} className="btn btn-primary">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button type="button" onClick={() => setShowEvidenceForm(false)} className="btn">
                Cancel
              </button>
            </div>
          </form>
        )}

        {practice.evidence?.length === 0 && !showEvidenceForm && (
          <p className="empty-state">No evidence uploaded yet.</p>
        )}

        {practice.evidence?.map(ev => (
          <div key={ev.id} className="evidence-item">
            <div className="evidence-info">
              <a
                href={`${API_URL}/api/evidence/${ev.id}/download`}
                className="evidence-name"
                download
              >
                {ev.name}
              </a>
              {ev.description && <span className="evidence-desc">{ev.description}</span>}
              <span className="evidence-meta">
                {ev.fileType?.toUpperCase()} • {new Date(ev.createdAt).toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={() => deleteEvidence(ev.id)}
              className="btn btn-small btn-danger"
              title="Delete evidence"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PracticeDetail;
