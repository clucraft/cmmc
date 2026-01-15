import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

function SystemInfo() {
  const [systemInfo, setSystemInfo] = useState({
    organizationName: '',
    systemName: '',
    systemDescription: '',
    systemOwner: '',
    securityOfficer: '',
    systemBoundary: '',
    networkArchitecture: '',
    dataFlowDescription: '',
    informationTypes: '',
    preparedBy: '',
    preparedDate: '',
    versionNumber: '1.0'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/system-info`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSystemInfo({
            organizationName: data.organizationName || '',
            systemName: data.systemName || '',
            systemDescription: data.systemDescription || '',
            systemOwner: data.systemOwner || '',
            securityOfficer: data.securityOfficer || '',
            systemBoundary: data.systemBoundary || '',
            networkArchitecture: data.networkArchitecture || '',
            dataFlowDescription: data.dataFlowDescription || '',
            informationTypes: data.informationTypes || '',
            preparedBy: data.preparedBy || '',
            preparedDate: data.preparedDate ? data.preparedDate.split('T')[0] : '',
            versionNumber: data.versionNumber || '1.0'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching system info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSystemInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...systemInfo,
        preparedDate: systemInfo.preparedDate ? new Date(systemInfo.preparedDate).toISOString() : null
      };

      const response = await fetch(`${API_URL}/api/system-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'System information saved successfully!' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving system information. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading system information...</div>;
  }

  return (
    <div className="system-info-page">
      <h2>System Information</h2>
      <p className="page-description">
        Configure your organization and system details for the System Security Plan (SSP).
      </p>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Organization Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="organizationName">Organization Name *</label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                value={systemInfo.organizationName}
                onChange={handleChange}
                required
                placeholder="Enter organization name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="systemName">System Name *</label>
              <input
                type="text"
                id="systemName"
                name="systemName"
                value={systemInfo.systemName}
                onChange={handleChange}
                required
                placeholder="e.g., Corporate Information System"
              />
            </div>
            <div className="form-group">
              <label htmlFor="versionNumber">SSP Version</label>
              <input
                type="text"
                id="versionNumber"
                name="versionNumber"
                value={systemInfo.versionNumber}
                onChange={handleChange}
                placeholder="1.0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="systemDescription">System Description</label>
            <textarea
              id="systemDescription"
              name="systemDescription"
              value={systemInfo.systemDescription}
              onChange={handleChange}
              rows="3"
              placeholder="Describe the system's purpose and key functions"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Key Personnel</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="systemOwner">System Owner</label>
              <input
                type="text"
                id="systemOwner"
                name="systemOwner"
                value={systemInfo.systemOwner}
                onChange={handleChange}
                placeholder="Name and title"
              />
            </div>
            <div className="form-group">
              <label htmlFor="securityOfficer">Information Security Officer</label>
              <input
                type="text"
                id="securityOfficer"
                name="securityOfficer"
                value={systemInfo.securityOfficer}
                onChange={handleChange}
                placeholder="Name and title"
              />
            </div>
            <div className="form-group">
              <label htmlFor="preparedBy">SSP Prepared By</label>
              <input
                type="text"
                id="preparedBy"
                name="preparedBy"
                value={systemInfo.preparedBy}
                onChange={handleChange}
                placeholder="Name and title"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preparedDate">Preparation Date</label>
              <input
                type="date"
                id="preparedDate"
                name="preparedDate"
                value={systemInfo.preparedDate}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>System Architecture</h3>
          <div className="form-group">
            <label htmlFor="systemBoundary">System Boundary</label>
            <textarea
              id="systemBoundary"
              name="systemBoundary"
              value={systemInfo.systemBoundary}
              onChange={handleChange}
              rows="3"
              placeholder="Define the authorization boundary for the system"
            />
          </div>

          <div className="form-group">
            <label htmlFor="networkArchitecture">Network Architecture</label>
            <textarea
              id="networkArchitecture"
              name="networkArchitecture"
              value={systemInfo.networkArchitecture}
              onChange={handleChange}
              rows="3"
              placeholder="Describe the network topology and components"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dataFlowDescription">Data Flow Description</label>
            <textarea
              id="dataFlowDescription"
              name="dataFlowDescription"
              value={systemInfo.dataFlowDescription}
              onChange={handleChange}
              rows="3"
              placeholder="Describe how CUI flows through the system"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Information Types</h3>
          <div className="form-group">
            <label htmlFor="informationTypes">CUI Categories Handled</label>
            <textarea
              id="informationTypes"
              name="informationTypes"
              value={systemInfo.informationTypes}
              onChange={handleChange}
              rows="3"
              placeholder="List the types of Controlled Unclassified Information (CUI) processed by the system"
            />
            <span className="form-help">
              Examples: CTI (Controlled Technical Information), ITAR, Export Controlled, Privacy Data
            </span>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save System Information'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SystemInfo;
