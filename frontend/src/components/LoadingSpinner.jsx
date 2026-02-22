import React from 'react';

export default function LoadingSpinner({ size = 'medium', text = 'Loading...' }) {
  return (
    <div className="loading-spinner-container">
      <div className={`spinner ${size}`} />
      {text && <div className="spinner-text">{text}</div>}
      <style>{`
        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          gap: 16px;
        }
        .spinner {
          border: 3px solid var(--border);
          border-top-color: var(--accent-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .spinner.small { width: 20px; height: 20px; }
        .spinner.medium { width: 40px; height: 40px; }
        .spinner.large { width: 60px; height: 60px; }
        .spinner-text {
          color: var(--text-dim);
          font-size: 14px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}