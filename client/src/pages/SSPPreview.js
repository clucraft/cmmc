import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../App';

function SSPPreview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFamilies, setExpandedFamilies] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/ssp/full-data`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocx = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ssp/generate/docx`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SSP_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const toggleFamily = (familyId) => {
    setExpandedFamilies((prev) => ({
      ...prev,
      [familyId]: !prev[familyId],
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    data.families.forEach((f) => (allExpanded[f.id] = true));
    setExpandedFamilies(allExpanded);
  };

  const collapseAll = () => {
    setExpandedFamilies({});
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'IMPLEMENTED':
        return 'status-implemented';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'NOT_APPLICABLE':
        return 'status-na';
      default:
        return 'status-not-started';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'IMPLEMENTED':
        return 'Implemented';
      case 'IN_PROGRESS':
        return 'Partially Implemented';
      case 'NOT_APPLICABLE':
        return 'Not Applicable';
      case 'NOT_STARTED':
        return 'Not Evaluated';
      default:
        return 'Not Evaluated';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getImpactClass = (level) => {
    switch (level) {
      case 'HIGH':
        return 'impact-high';
      case 'MODERATE':
        return 'impact-moderate';
      case 'LOW':
        return 'impact-low';
      default:
        return 'impact-low';
    }
  };

  if (loading) {
    return (
      <div className="ssp-preview-page">
        <div className="loading">Loading SSP data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ssp-preview-page">
        <div className="error">Error loading SSP data: {error}</div>
      </div>
    );
  }

  const { systemInfo, families, familyStats, overallStats, openPoams } = data;

  return (
    <div className="ssp-preview-page">
      {/* Action Bar - Hidden in print */}
      <div className="ssp-actions-bar no-print">
        <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
          Back to Reports
        </button>
        <div className="ssp-actions-right">
          <button className="btn btn-secondary" onClick={handlePrint}>
            Print / Save PDF
          </button>
          <button className="btn btn-primary" onClick={handleDownloadDocx}>
            Download Word
          </button>
        </div>
      </div>

      {/* SSP Document */}
      <div className="ssp-document">
        {/* Page Header */}
        <header className="ssp-header">
          <span className="ssp-header-left">{systemInfo.systemName || 'Information System'}</span>
          <span className="ssp-header-center">{systemInfo.organizationName} - Confidential</span>
          <span className="ssp-header-right">System Security Plan</span>
        </header>

        {/* Cover Page */}
        <section className="ssp-section ssp-cover-page">
          <h1 className="ssp-title">System Security Plan</h1>
          <h2 className="ssp-subtitle">{systemInfo.systemName || 'Information System'}</h2>
        </section>

        {/* Record of Changes */}
        <section className="ssp-section">
          <h2 className="ssp-section-title">Record of Changes</h2>
          <table className="ssp-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Date</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {systemInfo.sspVersions?.length > 0 ? (
                systemInfo.sspVersions.map((v) => (
                  <tr key={v.id}>
                    <td>{v.versionNumber}</td>
                    <td>{formatDate(v.changeDate)}</td>
                    <td>{v.description}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No changes to date</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Approvals */}
        <section className="ssp-section">
          <h2 className="ssp-section-title">System Security Plan (SSP)</h2>
          <h3 className="ssp-subsection-title">{systemInfo.systemName || 'Information System'}</h3>
          <p>
            We, the undersigned, approve the content of this System Security Plan for{' '}
            {systemInfo.systemName || 'this information system'}, including the system boundary and
            the associated assessment objectives for this system.
          </p>
          <h4>Approvals</h4>
          {systemInfo.personnel?.filter((p) => ['CEO', 'System Owner', 'Security Officer'].includes(p.role)).length > 0 ? (
            systemInfo.personnel
              .filter((p) => ['CEO', 'System Owner', 'Security Officer'].includes(p.role))
              .map((p) => (
                <div key={p.id} className="ssp-signature-block">
                  <div className="ssp-signature-line">______________________________________</div>
                  <div className="ssp-signature-name">{p.name}</div>
                  <div className="ssp-signature-title">{p.role}</div>
                </div>
              ))
          ) : (
            <div className="ssp-signature-block">
              <div className="ssp-signature-line">______________________________________</div>
              <div className="ssp-signature-name">{systemInfo.systemOwner || '[System Owner]'}</div>
              <div className="ssp-signature-title">System Owner</div>
            </div>
          )}
        </section>

        {/* Introduction */}
        <section className="ssp-section">
          <h2 className="ssp-section-title">Introduction</h2>
          <p>
            The purpose of this System Security Plan (SSP) is to implement controls, mandate policy,
            assign responsibility, and prescribe procedures for applying integrated and layered
            protection of the {systemInfo.systemName || 'information system'} using the CMMC 2.0
            Level 2 Practices to ensure the confidentiality, integrity, and availability of the
            system's information and intellectual property.
          </p>
          {systemInfo.systemDescription && <p>{systemInfo.systemDescription}</p>}
          <p>
            This SSP was created in accordance with Federal policies and National Institute of
            Standards and Technology (NIST) Special Publication (SP) 800-18, Rev.2, Guide for
            Developing Security Plans for Federal Information Systems.
          </p>
        </section>

        {/* Section 1: Information System Name */}
        <section className="ssp-section">
          <h2 className="ssp-section-title">Section 1: Information System Name</h2>
          <table className="ssp-table ssp-info-table">
            <tbody>
              <tr>
                <td className="ssp-label">Information System Name</td>
                <td>{systemInfo.systemName || 'Not specified'}</td>
              </tr>
              <tr>
                <td className="ssp-label">Unique Identifier</td>
                <td>{systemInfo.uniqueIdentifier || 'Not specified'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 2: System Roles & Responsibilities */}
        <section className="ssp-section">
          <h2 className="ssp-section-title">Section 2: System Roles & Responsibilities</h2>
          <table className="ssp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Title</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {systemInfo.personnel?.length > 0 ? (
                systemInfo.personnel.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.role}</td>
                    <td>{p.title || '-'}</td>
                    <td>{p.email || '-'}</td>
                    <td>{p.phone || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No personnel defined</td>
                </tr>
              )}
            </tbody>
          </table>

          <h3 className="ssp-subsection-title">Section 2.1: Role Definitions</h3>
          <table className="ssp-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Definition</th>
              </tr>
            </thead>
            <tbody>
              {systemInfo.personnel?.filter((p) => p.roleDefinition).length > 0 ? (
                systemInfo.personnel
                  .filter((p) => p.roleDefinition)
                  .map((p) => (
                    <tr key={p.id}>
                      <td>{p.role}</td>
                      <td>{p.roleDefinition}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="2">No role definitions provided</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Section 3: Information System Details */}
        <section className="ssp-section">
          <h2 className="ssp-section-title">Section 3: Information System Details</h2>

          {/* 3.1 Operational Status */}
          <h3 className="ssp-subsection-title">Section 3.1: Operational Status</h3>
          <table className="ssp-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    type="checkbox"
                    checked={systemInfo.operationalStatus === 'OPERATIONAL'}
                    readOnly
                  />
                </td>
                <td>Operational</td>
                <td>The system is in production</td>
              </tr>
              <tr>
                <td>
                  <input
                    type="checkbox"
                    checked={systemInfo.operationalStatus === 'UNDER_DEVELOPMENT'}
                    readOnly
                  />
                </td>
                <td>Under Development</td>
                <td>The system is being designed, developed, or implemented</td>
              </tr>
              <tr>
                <td>
                  <input
                    type="checkbox"
                    checked={systemInfo.operationalStatus === 'MAJOR_MODIFICATION'}
                    readOnly
                  />
                </td>
                <td>Major Modification</td>
                <td>The system is undergoing a major conversion or transition</td>
              </tr>
            </tbody>
          </table>

          {/* 3.2 Information System Type */}
          <h3 className="ssp-subsection-title">Section 3.2: Information System Type</h3>
          <p>
            {systemInfo.systemType
              ? `The ${systemInfo.systemName} is categorized as a ${systemInfo.systemType}.`
              : 'System type not specified.'}
          </p>
          {systemInfo.systemTypeDescription && <p>{systemInfo.systemTypeDescription}</p>}

          {/* 3.3 General System Description */}
          <h3 className="ssp-subsection-title">Section 3.3: General System Description/Purpose</h3>
          <p>{systemInfo.systemDescription || 'System description not provided.'}</p>

          {/* 3.4 System Environment Description */}
          <h3 className="ssp-subsection-title">Section 3.4: System Environment Description</h3>
          <p>{systemInfo.environmentDescription || systemInfo.systemBoundary || 'Environment description not provided.'}</p>

          {systemInfo.networkArchitecture && (
            <>
              <h4 className="ssp-subsubsection-title">Section 3.4.1: Networking/Communications Architecture</h4>
              <p>{systemInfo.networkArchitecture}</p>
            </>
          )}

          {/* 3.5 System Data Types */}
          <h3 className="ssp-subsection-title">Section 3.5: System Data Types</h3>
          <table className="ssp-table ssp-data-types-table">
            <thead>
              <tr>
                <th>Sensitive Information Type Name</th>
                <th>Description</th>
                <th>Loss of Confidentiality</th>
                <th>Loss of Integrity</th>
                <th>Loss of Availability</th>
              </tr>
            </thead>
            <tbody>
              {systemInfo.dataTypes?.length > 0 ? (
                systemInfo.dataTypes.map((dt) => (
                  <tr key={dt.id}>
                    <td>{dt.name}</td>
                    <td>{dt.description || '-'}</td>
                    <td className={getImpactClass(dt.confidentialityImpact)}>
                      {dt.confidentialityImpact}
                    </td>
                    <td className={getImpactClass(dt.integrityImpact)}>{dt.integrityImpact}</td>
                    <td className={getImpactClass(dt.availabilityImpact)}>
                      {dt.availabilityImpact}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No data types defined</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 3.6 Overall System Categorization */}
          <h3 className="ssp-subsection-title">Section 3.6: Overall System Categorization</h3>
          <table className="ssp-table ssp-categorization-table">
            <thead>
              <tr>
                <th>CIA Confidentiality</th>
                <th>CIA Integrity</th>
                <th>CIA Availability</th>
                <th>Security Category</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={getImpactClass(systemInfo.confidentialityLevel)}>
                  {systemInfo.confidentialityLevel || 'MODERATE'}
                </td>
                <td className={getImpactClass(systemInfo.integrityLevel)}>
                  {systemInfo.integrityLevel || 'LOW'}
                </td>
                <td className={getImpactClass(systemInfo.availabilityLevel)}>
                  {systemInfo.availabilityLevel || 'LOW'}
                </td>
                <td className={getImpactClass(systemInfo.overallCategorization)}>
                  {systemInfo.overallCategorization || 'MODERATE'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 3.7 System Interconnections */}
          <h3 className="ssp-subsection-title">Section 3.7: System Interconnections</h3>
          <table className="ssp-table">
            <thead>
              <tr>
                <th>Details</th>
                <th>Types</th>
                <th>Authorization</th>
                <th>Sensitive Info</th>
              </tr>
            </thead>
            <tbody>
              {systemInfo.interconnections?.length > 0 ? (
                systemInfo.interconnections.map((ic) => (
                  <tr key={ic.id}>
                    <td>{ic.systemName}</td>
                    <td>{ic.connectionType || '-'}</td>
                    <td>{ic.authorization || '-'}</td>
                    <td>{ic.sensitiveInfo || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No interconnections established</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 3.8 Related Laws, Regulations, & Policies */}
          <h3 className="ssp-subsection-title">Section 3.8: Related Laws, Regulations, & Policies</h3>
          <table className="ssp-table">
            <thead>
              <tr>
                <th>Law/Regulation/Policy</th>
                <th>Definition</th>
              </tr>
            </thead>
            <tbody>
              {systemInfo.lawsRegulations?.length > 0 ? (
                systemInfo.lawsRegulations.map((lr) => (
                  <tr key={lr.id}>
                    <td>{lr.name}</td>
                    <td>{lr.description || '-'}</td>
                  </tr>
                ))
              ) : (
                <>
                  <tr>
                    <td>NIST SP800-171</td>
                    <td>
                      NIST Special Publication 800-171 Protecting Controlled Unclassified
                      Information in Nonfederal Information Systems and Organizations
                    </td>
                  </tr>
                  <tr>
                    <td>DFARS 252.204-7012</td>
                    <td>
                      U.S. Department of Defense Federal Acquisition Regulations Supplement
                      "Safeguarding Covered Defense Information and Cyber Incident Reporting"
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          {/* 3.10 Physical Locations */}
          <h3 className="ssp-subsection-title">Section 3.10: System Components and Physical Security</h3>
          <h4 className="ssp-subsubsection-title">Section 3.10.2: Physical Location & Security</h4>
          <table className="ssp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>City</th>
                <th>State</th>
                <th>ZIP Code</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {systemInfo.physicalLocations?.length > 0 ? (
                systemInfo.physicalLocations.map((loc) => (
                  <tr key={loc.id}>
                    <td>{loc.name}</td>
                    <td>{loc.address || '-'}</td>
                    <td>{loc.city || '-'}</td>
                    <td>{loc.state || '-'}</td>
                    <td>{loc.zipCode || '-'}</td>
                    <td>{loc.country || 'USA'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No physical locations defined</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 3.11 Security Control Selection */}
          <h3 className="ssp-subsection-title">Section 3.11: Security Control Selection</h3>
          <table className="ssp-table ssp-info-table" style={{ marginBottom: '1rem' }}>
            <tbody>
              <tr>
                <td className="ssp-label">System Name</td>
                <td>{systemInfo.systemName || 'Not specified'}</td>
                <td className="ssp-label">Minimum Control Baseline</td>
                <td className={getImpactClass(systemInfo.overallCategorization)}>
                  {systemInfo.overallCategorization || 'Moderate'}
                </td>
              </tr>
            </tbody>
          </table>
          <table className="ssp-table">
            <thead>
              <tr>
                <th>Domain ID</th>
                <th>Domain Name</th>
                <th>Practices</th>
                <th>Implemented</th>
              </tr>
            </thead>
            <tbody>
              {familyStats.map((fs) => (
                <tr key={fs.familyId}>
                  <td>{fs.familyId}</td>
                  <td>{fs.familyName}</td>
                  <td>{fs.totalPractices}</td>
                  <td>{fs.implemented}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Section 4: Minimum Security Controls */}
        <section className="ssp-section">
          <h2 className="ssp-section-title">Section 4: Minimum Security Controls</h2>
          <p>
            The security controls listed below provide the minimum security controls required for
            the information system. Each security control contains a statement indicating the status
            and an explanation of how the control is implemented.
          </p>

          {/* 4.1 Charts */}
          <h3 className="ssp-subsection-title">Section 4.1: Compliance Summary</h3>
          <div className="ssp-sprs-display">
            <div className="ssp-sprs-label">Self-Assessment Score (SPRS)</div>
            <div className="ssp-sprs-score">{overallStats.sprsScore}</div>
          </div>

          <div className="ssp-compliance-charts">
            {familyStats.map((fs) => (
              <div key={fs.familyId} className="ssp-compliance-chart">
                <div className="ssp-chart-title">{fs.familyName}</div>
                <div className="ssp-chart-donut">
                  <svg viewBox="0 0 36 36" className="ssp-donut">
                    <path
                      className="ssp-donut-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="ssp-donut-fill"
                      strokeDasharray={`${fs.compliancePercentage}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.5" className="ssp-donut-text">
                      {fs.compliancePercentage}%
                    </text>
                  </svg>
                </div>
                <div className="ssp-chart-legend">
                  <span className="legend-implemented">{fs.implemented} Impl</span>
                  <span className="legend-not-implemented">{fs.notImplemented + fs.notEvaluated} Not</span>
                </div>
              </div>
            ))}
          </div>

          {/* 4.2 Control Tables */}
          <h3 className="ssp-subsection-title">Section 4.2: Control Tables</h3>
          <div className="ssp-expand-controls no-print">
            <button className="btn btn-sm" onClick={expandAll}>
              Expand All
            </button>
            <button className="btn btn-sm" onClick={collapseAll}>
              Collapse All
            </button>
          </div>

          {families.map((family) => (
            <div key={family.id} className="ssp-family-section">
              <div
                className="ssp-family-header"
                onClick={() => toggleFamily(family.id)}
              >
                <span className="ssp-family-toggle">
                  {expandedFamilies[family.id] ? '[-]' : '[+]'}
                </span>
                <span className="ssp-family-id">{family.id}</span>
                <span className="ssp-family-name">{family.name}</span>
                <span className="ssp-family-count">
                  {family.practices.length} practices
                </span>
              </div>

              {expandedFamilies[family.id] && (
                <div className="ssp-practices-list">
                  {family.practices.map((practice) => {
                    const assessment = practice.assessments[0];
                    const status = assessment?.status || 'NOT_STARTED';

                    return (
                      <div key={practice.id} className="ssp-practice-card">
                        <div className="ssp-practice-header">
                          <span className="ssp-practice-id">{practice.id}</span>
                          <span className="ssp-practice-title">{practice.title}</span>
                          <span className={`ssp-practice-status ${getStatusClass(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        <div className="ssp-practice-description">
                          <strong>Requirement:</strong> {practice.description}
                        </div>

                        <div className="ssp-practice-implementation">
                          <strong>Implementation:</strong>{' '}
                          {assessment?.implementationStatement ||
                            practice.implementationTemplate ||
                            'Implementation statement not provided.'}
                        </div>

                        {assessment?.validationMethods && (
                          <div className="ssp-practice-validation">
                            <strong>Validation Methods:</strong> {assessment.validationMethods}
                          </div>
                        )}

                        {assessment?.findings && (
                          <div className="ssp-practice-findings">
                            <strong>Findings:</strong> {assessment.findings}
                          </div>
                        )}

                        {assessment?.recommendations && (
                          <div className="ssp-practice-recommendations">
                            <strong>Recommendations:</strong> {assessment.recommendations}
                          </div>
                        )}

                        {practice.evidence?.length > 0 && (
                          <div className="ssp-practice-evidence">
                            <strong>Evidence:</strong>{' '}
                            {practice.evidence.map((e) => e.name).join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* POA&M Summary */}
        {openPoams.length > 0 && (
          <section className="ssp-section">
            <h2 className="ssp-section-title">
              Section 5: Plan of Action and Milestones (POA&M) Summary
            </h2>
            <table className="ssp-table">
              <thead>
                <tr>
                  <th>Practice</th>
                  <th>Weakness</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {openPoams.slice(0, 25).map((poam) => (
                  <tr key={poam.id}>
                    <td>{poam.practice.id}</td>
                    <td>{poam.weakness?.substring(0, 80)}{poam.weakness?.length > 80 ? '...' : ''}</td>
                    <td>{poam.status}</td>
                    <td>{poam.priority}</td>
                    <td>{formatDate(poam.scheduledCompletionDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Footer */}
        <footer className="ssp-footer">
          <span>Generated by CMMC Compliance Tracker</span>
          <span>Confidential</span>
          <span>{new Date().toLocaleDateString()}</span>
        </footer>
      </div>
    </div>
  );
}

export default SSPPreview;
