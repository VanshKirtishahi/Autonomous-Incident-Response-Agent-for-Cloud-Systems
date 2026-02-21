import React from 'react';

const RecentIncidentsList = ({ incidents }) => {
  return (
    <div className="recent-incidents-container">
      {(!incidents || incidents.length === 0) ? (
        <p>No active incidents.</p>
      ) : (
        incidents.map((incident, index) => {
          // Generates a strictly unique key combining the ID and index to completely eliminate the React warning
          const uniqueKey = incident?.incidentId ? `${incident.incidentId}-${index}` : `incident-fallback-${index}`;
          
          return (
            <div key={uniqueKey} className="incident-card">
              <div className="incident-header">
                <h4>{incident?.title ?? 'Unknown Incident'}</h4>
                <span className={`badge ${incident?.severity ?? 'low'}`}>
                  {incident?.severity ?? 'N/A'}
                </span>
              </div>
              <div className="incident-body">
                <p><strong>Service:</strong> {incident?.affectedService ?? 'Unknown'}</p>
                <p><strong>Status:</strong> {incident?.status ?? 'Unknown'}</p>
                <p><strong>Type:</strong> {incident?.type?.replace(/_/g, ' ') ?? 'Unknown Type'}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default RecentIncidentsList;