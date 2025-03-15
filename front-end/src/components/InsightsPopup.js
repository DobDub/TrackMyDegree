// InsightsPopup.js

import React from 'react';
import ProgressChart from './ProgressChart';

const InsightsPopup = ({ onClose, poolCredits }) => {
  const totalCreditsEarned = Object.values(poolCredits).reduce(
    (sum, pool) => sum + (pool.creditsEarned || 0),
    0
  );
  const totalCreditsRequired = poolCredits.deficiency
    ? 120 + poolCredits.deficiency.totalCredits
    : 120;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-btn-x" onClick={onClose}>
          ×
        </button>
        <h2>Progress Overview</h2>
        <div className="charts-container">
          <div className="overall-progress">
            <ProgressChart
              type="pie"
              poolName="Overall Progress"
              creditsEarned={totalCreditsEarned}
              totalCredits={totalCreditsRequired}
            />
          </div>
          {Object.entries(poolCredits).map(([poolId, { poolName, creditsEarned, totalCredits }]) => (
            poolId !== 'deficiency' && (
              <ProgressChart
                key={poolId}
                type="bar"
                poolName={poolName}
                creditsEarned={creditsEarned}
                totalCredits={totalCredits || creditsEarned}
              />
            )
          ))}
        </div>
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default InsightsPopup;